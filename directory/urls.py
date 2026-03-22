from django.urls import path

from .views import (
    CategoryListAPIView,
    HomeDataAPIView,
    LocationListAPIView,
    WorkerListAPIView,
    WorkerSubmissionCreateAPIView,
)

urlpatterns = [
    path("home/", HomeDataAPIView.as_view(), name="home-data"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("locations/", LocationListAPIView.as_view(), name="location-list"),
    path("workers/", WorkerListAPIView.as_view(), name="worker-list"),
    path("worker-submissions/", WorkerSubmissionCreateAPIView.as_view(), name="worker-submission-create"),
]
