import re

from django.db import models
from django.utils import timezone


def normalize_phone_number(value):
    return re.sub(r"\D", "", value or "")


class Location(models.Model):
    city = models.CharField(max_length=100)
    area_name = models.CharField(max_length=150)
    pincode = models.CharField(max_length=10, db_index=True)

    class Meta:
        unique_together = ("area_name", "pincode")
        ordering = ("city", "area_name")

    def __str__(self):
        return f"{self.area_name}, {self.city} - {self.pincode}"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Worker(models.Model):
    name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="workers")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="workers")
    is_verified = models.BooleanField(default=False)
    availability_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-is_verified", "-availability_status", "name")

    @property
    def normalized_phone_number(self):
        return normalize_phone_number(self.phone_number)

    @property
    def whatsapp_url(self):
        return f"https://wa.me/{self.normalized_phone_number}"

    @property
    def call_url(self):
        return f"tel:{self.phone_number}"

    def __str__(self):
        return f"{self.name} - {self.category.name}"


class Rating(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name="ratings")
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.rating} stars for {self.worker.name}"


class WorkerSubmission(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    )

    name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="submissions")
    city = models.CharField(max_length=100)
    area_name = models.CharField(max_length=150)
    pincode = models.CharField(max_length=10, db_index=True)
    service_description = models.TextField(blank=True)
    availability_status = models.BooleanField(default=True)
    consent_to_contact = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    approved_worker = models.OneToOneField(
        Worker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submission",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    @property
    def normalized_phone_number(self):
        return normalize_phone_number(self.phone_number)

    def approve(self):
        self.status = self.STATUS_APPROVED
        self.reviewed_at = timezone.now()

    def reject(self):
        self.status = self.STATUS_REJECTED
        self.reviewed_at = timezone.now()
