from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Location, Rating, Worker, WorkerSubmission
from .serializers import (
    CategorySerializer,
    LocationSerializer,
    RatingSerializer,
    WorkerSerializer,
    WorkerSubmissionSerializer,
)


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
        return Category.objects.annotate(worker_count=Count("workers", distinct=True))


class LocationListAPIView(ListAPIView):
    serializer_class = LocationSerializer

    def get_queryset(self):
        queryset = Location.objects.all()
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


class RatingCreateAPIView(APIView):
    def post(self, request, pk):
        worker = Worker.objects.filter(pk=pk).first()
        if not worker:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = RatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(worker=worker)
        avg = worker.ratings.aggregate(avg=Avg("rating"))["avg"]
        return Response(
            {"average_rating": round(avg, 1) if avg else None, **serializer.data},
            status=status.HTTP_201_CREATED,
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
            "message": "Your profile is now live! It will be marked as verified after review.",
        }
        headers = self.get_success_headers(payload)
        return Response(payload, status=status.HTTP_201_CREATED, headers=headers)


class HomeDataAPIView(APIView):
    def get(self, request):
        categories = Category.objects.annotate(worker_count=Count("workers", distinct=True))
        locations = Location.objects.annotate(worker_count=Count("workers", distinct=True))
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
