from django.urls import path

from .views import (
    CategoryListAPIView,
    HomeDataAPIView,
    LocationListAPIView,
    RatingCreateAPIView,
    WorkerDetailAPIView,
    WorkerListAPIView,
    WorkerSubmissionCreateAPIView,
)

urlpatterns = [
    path("home/", HomeDataAPIView.as_view(), name="home-data"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("locations/", LocationListAPIView.as_view(), name="location-list"),
    path("workers/", WorkerListAPIView.as_view(), name="worker-list"),
    path("workers/<int:pk>/", WorkerDetailAPIView.as_view(), name="worker-detail"),
    path("workers/<int:pk>/ratings/", RatingCreateAPIView.as_view(), name="worker-rating-create"),
    path("worker-submissions/", WorkerSubmissionCreateAPIView.as_view(), name="worker-submission-create"),
]
