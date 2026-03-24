from django.db.models import Avg
from rest_framework import serializers

from .models import Category, Location, Rating, Worker, WorkerSubmission, normalize_phone_number


class CategorySerializer(serializers.ModelSerializer):
    worker_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ("id", "name", "icon_url", "worker_count")


class LocationSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ("id", "city", "area_name", "pincode", "display_name")

    def get_display_name(self, obj):
        return f"{obj.area_name}, {obj.city}"


class WorkerCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "icon_url")


class WorkerLocationSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ("id", "city", "area_name", "pincode", "display_name")

    def get_display_name(self, obj):
        return f"{obj.area_name}, {obj.city}"


class WorkerSerializer(serializers.ModelSerializer):
    category = WorkerCategorySerializer(read_only=True)
    location = WorkerLocationSerializer(read_only=True)
    whatsapp_url = serializers.CharField(read_only=True)
    call_url = serializers.CharField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    service_description = serializers.SerializerMethodField()

    class Meta:
        model = Worker
        fields = (
            "id",
            "name",
            "phone_number",
            "category",
            "location",
            "is_verified",
            "availability_status",
            "call_clicks",
            "whatsapp_clicks",
            "created_at",
            "whatsapp_url",
            "call_url",
            "average_rating",
            "service_description",
        )

    def get_average_rating(self, obj):
        average = getattr(obj, "average_rating", None)
        if average is None:
            average = obj.ratings.aggregate(avg=Avg("rating"))["avg"]
        return round(average, 1) if average is not None else None

    def get_service_description(self, obj):
        submission = getattr(obj, "submission", None)
        return submission.service_description if submission else ""


class WorkerSelfUpdateSerializer(serializers.ModelSerializer):
    """Partial updates for the listing owner; `phone` is verified on the view, not updated here."""

    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    area_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    pincode = serializers.CharField(write_only=True, required=False, allow_blank=True)
    service_description = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Worker
        fields = (
            "name",
            "category",
            "availability_status",
            "city",
            "area_name",
            "pincode",
            "service_description",
        )

    def validate_pincode(self, value):
        if value is None or value == "":
            return value
        normalized = str(value).strip()
        if not normalized.isdigit() or len(normalized) != 6:
            raise serializers.ValidationError("Enter a valid 6-digit pincode.")
        return normalized

    def validate(self, attrs):
        location_keys = {"city", "area_name", "pincode"}
        present = location_keys.intersection(attrs.keys())
        if present and present != location_keys:
            raise serializers.ValidationError(
                "To change your service area, include city, area_name, and pincode together."
            )
        return attrs

    def update(self, instance, validated_data):
        service_description = validated_data.pop("service_description", serializers.empty)
        city = validated_data.pop("city", None)
        area_name = validated_data.pop("area_name", None)
        pincode = validated_data.pop("pincode", None)

        if city is not None and area_name is not None and pincode is not None:
            location, _ = Location.objects.get_or_create(
                area_name=area_name.strip(),
                pincode=pincode.strip(),
                defaults={"city": city.strip()},
            )
            validated_data["location"] = location

        worker = super().update(instance, validated_data)

        if service_description is not serializers.empty:
            submission = getattr(worker, "submission", None)
            if submission:
                submission.service_description = service_description or ""
                submission.save(update_fields=["service_description"])

        return worker


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ("id", "rating", "created_at")
        read_only_fields = ("id", "created_at")


class WorkerSubmissionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = WorkerSubmission
        fields = (
            "id",
            "name",
            "phone_number",
            "category",
            "category_name",
            "city",
            "area_name",
            "pincode",
            "service_description",
            "availability_status",
            "consent_to_contact",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "status", "created_at", "category_name")

    def validate_phone_number(self, value):
        normalized = normalize_phone_number(value)
        if len(normalized) < 10 or len(normalized) > 15:
            raise serializers.ValidationError("Enter a valid phone or WhatsApp number.")
        return normalized

    def validate_pincode(self, value):
        normalized = value.strip()
        if not normalized.isdigit() or len(normalized) != 6:
            raise serializers.ValidationError("Enter a valid 6-digit pincode.")
        return normalized

    def validate(self, attrs):
        phone_number = attrs["phone_number"]

        if not attrs.get("consent_to_contact"):
            raise serializers.ValidationError(
                {"consent_to_contact": "Consent is required before submitting your details."}
            )

        # Block if a pending/approved submission already exists for this number
        if WorkerSubmission.objects.filter(
            phone_number=phone_number,
            status__in=[
                WorkerSubmission.STATUS_PENDING,
                WorkerSubmission.STATUS_APPROVED,
            ],
        ).exists():
            raise serializers.ValidationError(
                {"phone_number": "A submission for this number is already under review."}
            )

        # Block if a verified worker already exists (not created by a pending submission)
        if Worker.objects.filter(phone_number=phone_number, is_verified=True).exists():
            raise serializers.ValidationError(
                {"phone_number": "This number is already listed in the directory."}
            )

        return attrs
