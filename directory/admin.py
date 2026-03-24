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
        "call_clicks",
        "whatsapp_clicks",
        "created_at",
    )
    list_filter = ("category", "location__city", "is_verified", "availability_status")
    search_fields = ("name", "phone_number", "location__area_name", "location__city")
    autocomplete_fields = ("category", "location")


@admin.action(description="Approve selected submissions and create worker listings")
def approve_submissions(modeladmin, request, queryset):
    approved_count = 0
    for submission in queryset:
        # If already approved but worker not verified, fix it
        if submission.status == WorkerSubmission.STATUS_APPROVED:
            worker = submission.approved_worker
            if not worker:
                # Try to find by normalized phone number
                normalized = submission.normalized_phone_number
                worker = (
                    Worker.objects.filter(phone_number=normalized).first()
                    or Worker.objects.filter(phone_number=submission.phone_number).first()
                )
                if worker:
                    submission.approved_worker = worker
                    submission.save(update_fields=["approved_worker"])
            if worker:
                worker.is_verified = True
                worker.save(update_fields=["is_verified"])
                approved_count += 1
            else:
                # No worker at all — create one now
                submission.status = WorkerSubmission.STATUS_PENDING
                submission.save(update_fields=["status"])
                submission.approve()
                approved_count += 1
        else:
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
    list_display = ("worker", "rating", "client_ip", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("worker__name",)
