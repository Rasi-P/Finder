from django.urls import path

from .views import (
    CategoryListAPIView,
    HomeDataAPIView,
    LocationListAPIView,
    RatingCreateAPIView,
    SubmissionStatusAPIView,
    WorkerDetailAPIView,
    WorkerListAPIView,
    WorkerPendingUpdateAPIView,
    WorkerSelfServiceAPIView,
    WorkerSubmissionCreateAPIView,
    WorkerTrackCallAPIView,
    WorkerTrackWhatsAppAPIView,
)

urlpatterns = [
    path("home/", HomeDataAPIView.as_view(), name="home-data"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("locations/", LocationListAPIView.as_view(), name="location-list"),
    path("workers/", WorkerListAPIView.as_view(), name="worker-list"),
    path("workers/<int:pk>/pending-update/", WorkerPendingUpdateAPIView.as_view(), name="worker-pending-update"),
    path("workers/<int:pk>/self/", WorkerSelfServiceAPIView.as_view(), name="worker-self"),
    path("workers/<int:pk>/track-call/", WorkerTrackCallAPIView.as_view(), name="worker-track-call"),
    path("workers/<int:pk>/track-whatsapp/", WorkerTrackWhatsAppAPIView.as_view(), name="worker-track-whatsapp"),
    path("workers/<int:pk>/ratings/", RatingCreateAPIView.as_view(), name="worker-rating-create"),
    path("workers/<int:pk>/", WorkerDetailAPIView.as_view(), name="worker-detail"),
    path("worker-submissions/", WorkerSubmissionCreateAPIView.as_view(), name="worker-submission-create"),
    path("submission-status/", SubmissionStatusAPIView.as_view(), name="submission-status"),
]
