from django.db.models import Avg, Count, F, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Category, Location, Rating, Worker, WorkerSubmission, WorkerUpdateRequest, normalize_phone_number
from .serializers import (
    CategorySerializer,
    LocationSerializer,
    RatingSerializer,
    WorkerSerializer,
    WorkerSubmissionSerializer,
)


def verified_worker_count():
    """Count workers linked to this category/location that are admin-verified."""
    return Count("workers", filter=Q(workers__is_verified=True), distinct=True)


def get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return (request.META.get("REMOTE_ADDR") or "").strip()


def parse_bool(value):
    if value is None:
        return None

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y"}:
        return True
    if normalized in {"0", "false", "no", "n"}:
        return False
    return None


class CategoryListAPIView(ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(worker_count=verified_worker_count())


class LocationListAPIView(ListAPIView):
    serializer_class = LocationSerializer

    def get_queryset(self):
        queryset = (
            Location.objects.annotate(worker_count=verified_worker_count())
            .filter(worker_count__gt=0)
            .order_by("city", "area_name")
        )
        q = self.request.query_params.get("q")
        pincode = self.request.query_params.get("pincode")

        if pincode:
            queryset = queryset.filter(pincode__icontains=pincode.strip())

        if q:
            term = q.strip()
            queryset = queryset.filter(
                Q(city__icontains=term)
                | Q(area_name__icontains=term)
                | Q(pincode__icontains=term)
            )

        return queryset


class WorkerListAPIView(ListAPIView):
    serializer_class = WorkerSerializer

    def get_queryset(self):
        queryset = (
            Worker.objects.select_related("category", "location")
            .filter(is_verified=True)
            .annotate(average_rating=Avg("ratings__rating"))
        )

        category = self.request.query_params.get("category")
        location = self.request.query_params.get("location")
        pincode = self.request.query_params.get("pincode")
        city = self.request.query_params.get("city")
        area = self.request.query_params.get("area")
        search = self.request.query_params.get("search")
        verified = parse_bool(self.request.query_params.get("verified"))
        available = parse_bool(self.request.query_params.get("available"))

        if category:
            category = category.strip()
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                queryset = queryset.filter(category__name__iexact=category)

        if location:
            location = location.strip()
            if location.isdigit():
                queryset = queryset.filter(location_id=int(location))
            else:
                queryset = queryset.filter(
                    Q(location__area_name__iexact=location)
                    | Q(location__city__iexact=location)
                    | Q(location__pincode__iexact=location)
                )

        if pincode:
            queryset = queryset.filter(location__pincode__icontains=pincode.strip())

        if city:
            queryset = queryset.filter(location__city__icontains=city.strip())

        if area:
            queryset = queryset.filter(location__area_name__icontains=area.strip())

        if search:
            term = search.strip()
            queryset = queryset.filter(
                Q(name__icontains=term)
                | Q(category__name__icontains=term)
                | Q(location__area_name__icontains=term)
                | Q(location__city__icontains=term)
            )

        if verified is not None:
            queryset = queryset.filter(is_verified=verified)

        if available is not None:
            queryset = queryset.filter(availability_status=available)

        return queryset.distinct().order_by("-is_verified", "-availability_status", "name")


class WorkerDetailAPIView(RetrieveAPIView):
    serializer_class = WorkerSerializer

    def get_queryset(self):
        return (
            Worker.objects.select_related("category", "location")
            .annotate(average_rating=Avg("ratings__rating"))
        )

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs["pk"])
        if obj.is_verified:
            return obj
        raw = (self.request.query_params.get("phone") or self.request.query_params.get("phone_number") or "").strip()
        if not raw:
            raise PermissionDenied(
                detail=(
                    "This listing is not public until verified. "
                    "Use ?phone= with your registered number to view your own profile."
                )
            )
        if normalize_phone_number(raw) != obj.normalized_phone_number:
            raise PermissionDenied(detail="Phone number does not match this listing.")
        return obj


def verify_worker_ownership(request, worker):
    raw = (request.data.get("phone") or request.data.get("phone_number") or "").strip()
    if not raw:
        return False, Response(
            {
                "detail": "Include your registered number as `phone` or `phone_number` in the JSON body.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    normalized = normalize_phone_number(raw)
    if len(normalized) < 10 or len(normalized) > 15:
        return False, Response(
            {"detail": "Enter a valid phone or WhatsApp number."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if normalized != worker.normalized_phone_number:
        return False, Response(
            {"detail": "Phone number does not match this listing."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return True, None


class WorkerSelfServiceAPIView(APIView):
    """PATCH / DELETE own worker row; ownership proven by matching phone in JSON body (no login)."""

    def patch(self, request, pk):
        worker = Worker.objects.filter(pk=pk).first()
        if not worker:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        ok, err = verify_worker_ownership(request, worker)
        if not ok:
            return err

        data = {k: v for k, v in request.data.items() if k not in ("phone", "phone_number")}
        if not data:
            return Response({"detail": "No fields to update."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate pincode if provided
        pincode = data.get("pincode", "").strip()
        if pincode and (not pincode.isdigit() or len(pincode) != 6):
            return Response({"detail": "Enter a valid 6-digit pincode."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate phone if provided
        new_phone = normalize_phone_number(data.get("new_phone_number", ""))
        if new_phone and (len(new_phone) < 10 or len(new_phone) > 15):
            return Response({"detail": "Enter a valid phone number."}, status=status.HTTP_400_BAD_REQUEST)
        if new_phone and Worker.objects.filter(phone_number=new_phone).exclude(pk=pk).exists():
            return Response({"detail": "This phone number is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        # Cancel any existing pending update request for this worker
        WorkerUpdateRequest.objects.filter(
            worker=worker, status=WorkerUpdateRequest.STATUS_PENDING
        ).update(status=WorkerUpdateRequest.STATUS_REJECTED)

        category_obj = None
        category_id = data.get("category")
        if category_id:
            category_obj = Category.objects.filter(pk=category_id).first()

        availability = data.get("availability_status")
        if availability is not None and not isinstance(availability, bool):
            availability = str(availability).lower() in ("true", "1", "yes")

        WorkerUpdateRequest.objects.create(
            worker=worker,
            name=data.get("name", "").strip(),
            phone_number=new_phone,
            category=category_obj,
            city=data.get("city", "").strip(),
            area_name=data.get("area_name", "").strip(),
            pincode=pincode,
            service_description=data.get("service_description", "").strip(),
            availability_status=availability,
        )

        return Response(
            {"detail": "Your changes have been submitted and are waiting for admin approval."},
            status=status.HTTP_202_ACCEPTED,
        )

    def delete(self, request, pk):
        worker = Worker.objects.filter(pk=pk).first()
        if not worker:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        ok, err = verify_worker_ownership(request, worker)
        if not ok:
            return err
        worker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkerPendingUpdateAPIView(APIView):
    """Return the latest pending update request for a worker (owner-only via phone)."""

    def get(self, request, pk):
        worker = Worker.objects.filter(pk=pk).first()
        if not worker:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        raw = (request.query_params.get("phone") or request.query_params.get("phone_number") or "").strip()
        if not raw or normalize_phone_number(raw) != worker.normalized_phone_number:
            return Response({"detail": "Phone number does not match."}, status=status.HTTP_403_FORBIDDEN)
        req = WorkerUpdateRequest.objects.filter(worker=worker, status=WorkerUpdateRequest.STATUS_PENDING).first()
        if not req:
            return Response({"pending": None})
        return Response({
            "pending": {
                "name": req.name or None,
                "category": req.category.name if req.category else None,
                "availability_status": req.availability_status,
                "city": req.city or None,
                "area_name": req.area_name or None,
                "pincode": req.pincode or None,
                "service_description": req.service_description or None,
                "created_at": req.created_at,
            }
        })


class WorkerTrackCallAPIView(APIView):
    def post(self, request, pk):
        updated = Worker.objects.filter(pk=pk).update(call_clicks=F("call_clicks") + 1)
        if not updated:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkerTrackWhatsAppAPIView(APIView):
    def post(self, request, pk):
        updated = Worker.objects.filter(pk=pk).update(whatsapp_clicks=F("whatsapp_clicks") + 1)
        if not updated:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RatingCreateAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ratings"

    def post(self, request, pk):
        worker = Worker.objects.filter(pk=pk).first()
        if not worker:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        client_ip = get_client_ip(request)
        if client_ip and Rating.objects.filter(worker=worker, client_ip=client_ip).exists():
            return Response(
                {"detail": "You have already submitted a rating for this worker from this device/network."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = RatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(worker=worker, client_ip=client_ip)
        avg = worker.ratings.aggregate(avg=Avg("rating"))["avg"]
        return Response(
            {"average_rating": round(avg, 1) if avg else None, **serializer.data},
            status=status.HTTP_201_CREATED,
        )


class SubmissionStatusAPIView(APIView):
    """Look up latest worker self-submission by normalized phone (no login)."""

    def get(self, request):
        raw = (request.query_params.get("phone") or request.query_params.get("phone_number") or "").strip()
        if not raw:
            return Response(
                {"detail": "Query parameter 'phone' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        normalized = normalize_phone_number(raw)
        if len(normalized) < 10 or len(normalized) > 15:
            return Response(
                {"detail": "Enter a valid phone or WhatsApp number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission = (
            WorkerSubmission.objects.filter(phone_number=normalized)
            .select_related("approved_worker")
            .order_by("-created_at")
            .first()
        )
        if not submission:
            return Response(
                {"detail": "No submission found for this number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        worker = submission.approved_worker
        return Response(
            {
                "status": submission.status,
                "is_verified": worker.is_verified if worker else False,
                "worker_id": worker.id if worker else None,
                "submission_id": submission.id,
            }
        )


class WorkerSubmissionCreateAPIView(CreateAPIView):
    queryset = WorkerSubmission.objects.all()
    serializer_class = WorkerSubmissionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()

        # Auto-create an unverified Worker immediately so they appear in the directory
        location, _ = Location.objects.get_or_create(
            area_name=submission.area_name.strip(),
            pincode=submission.pincode.strip(),
            defaults={"city": submission.city.strip()},
        )
        worker, _ = Worker.objects.get_or_create(
            phone_number=submission.normalized_phone_number,
            defaults={
                "name": submission.name.strip(),
                "category": submission.category,
                "location": location,
                "is_verified": False,
                "availability_status": submission.availability_status,
            },
        )
        submission.phone_number = submission.normalized_phone_number
        submission.approved_worker = worker
        submission.save(update_fields=["phone_number", "approved_worker"])

        payload = {
            "id": submission.id,
            "status": submission.status,
            "phone_number": submission.phone_number,
            "worker_id": worker.id,
            "message": "Your profile is now live! It will be marked as verified after review.",
        }
        headers = self.get_success_headers(payload)
        return Response(payload, status=status.HTTP_201_CREATED, headers=headers)


class HomeDataAPIView(APIView):
    def get(self, request):
        categories = Category.objects.annotate(worker_count=verified_worker_count())
        locations = (
            Location.objects.annotate(worker_count=verified_worker_count())
            .filter(worker_count__gt=0)
            .order_by("city", "area_name")
        )
        featured_workers = (
            Worker.objects.select_related("category", "location")
            .annotate(average_rating=Avg("ratings__rating"))
            .filter(is_verified=True, availability_status=True)[:6]
        )

        payload = {
            "stats": {
                "categories": categories.count(),
                "locations": locations.count(),
                "workers": Worker.objects.count(),
                "verified_workers": Worker.objects.filter(is_verified=True).count(),
                "pending_submissions": WorkerSubmission.objects.filter(
                    status=WorkerSubmission.STATUS_PENDING
                ).count(),
            },
            "categories": CategorySerializer(categories, many=True).data,
            "locations": LocationSerializer(locations[:8], many=True).data,
            "featured_workers": WorkerSerializer(featured_workers, many=True).data,
        }
        return Response(payload)
