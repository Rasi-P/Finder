from django.contrib import admin, messages

from .models import Category, Location, Rating, Worker, WorkerSubmission


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("area_name", "city", "pincode")
    search_fields = ("area_name", "city", "pincode")
    ordering = ("city", "area_name")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon_url")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "location",
        "is_verified",
        "availability_status",
        "created_at",
    )
    list_filter = ("category", "location__city", "is_verified", "availability_status")
    search_fields = ("name", "phone_number", "location__area_name", "location__city")
    autocomplete_fields = ("category", "location")


@admin.action(description="Approve selected submissions and create worker listings")
def approve_submissions(modeladmin, request, queryset):
    approved_count = 0
    # include stuck approved submissions that never got a worker created
    to_process = queryset.exclude(
        status=WorkerSubmission.STATUS_APPROVED,
        approved_worker__isnull=False,
    )
    for submission in to_process:
        submission.status = WorkerSubmission.STATUS_PENDING
        submission.approved_worker = None
        submission.save(update_fields=["status", "approved_worker"])
        submission.approve()
        approved_count += 1

    modeladmin.message_user(
        request,
        f"Approved {approved_count} submission(s).",
        level=messages.SUCCESS,
    )


@admin.action(description="Reject selected submissions")
def reject_submissions(modeladmin, request, queryset):
    rejected_count = 0
    for submission in queryset:
        submission.reject()
        rejected_count += 1

    modeladmin.message_user(
        request,
        f"Rejected {rejected_count} submission(s).",
        level=messages.WARNING,
    )


@admin.register(WorkerSubmission)
class WorkerSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "phone_number",
        "city",
        "area_name",
        "pincode",
        "status",
        "created_at",
    )
    list_filter = ("status", "category", "availability_status", "city")
    search_fields = ("name", "phone_number", "city", "area_name", "pincode")
    autocomplete_fields = ("category", "approved_worker")
    readonly_fields = ("approved_worker", "created_at", "reviewed_at")
    actions = (approve_submissions, reject_submissions)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("worker", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("worker__name",)
