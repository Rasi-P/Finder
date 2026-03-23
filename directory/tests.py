from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Category, Location, Rating, Worker, WorkerSubmission


class DirectoryApiTests(APITestCase):
    def setUp(self):
        self.plumber = Category.objects.create(name="Plumber")
        self.electrician = Category.objects.create(name="Electrician")

        self.ramanattukara = Location.objects.create(
            city="Kozhikode",
            area_name="Ramanattukara",
            pincode="673633",
        )
        self.feroke = Location.objects.create(
            city="Kozhikode",
            area_name="Feroke",
            pincode="673631",
        )

        self.verified_worker = Worker.objects.create(
            name="Niyas",
            phone_number="919744000001",
            category=self.plumber,
            location=self.ramanattukara,
            is_verified=True,
            availability_status=True,
        )
        self.unverified_worker = Worker.objects.create(
            name="Afsal",
            phone_number="919744000002",
            category=self.electrician,
            location=self.feroke,
            is_verified=False,
            availability_status=False,
        )

        Rating.objects.create(worker=self.verified_worker, rating=5)
        Rating.objects.create(worker=self.verified_worker, rating=4)

    def test_categories_include_worker_count(self):
        response = self.client.get(reverse("category-list"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 2)
        plumber = next(item for item in payload if item["name"] == "Plumber")
        self.assertEqual(plumber["worker_count"], 1)

    def test_workers_filter_by_category_and_pincode(self):
        response = self.client.get(
            reverse("worker-list"),
            {"category": "Plumber", "pincode": "673633"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()["results"]
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["name"], "Niyas")
        self.assertEqual(payload[0]["whatsapp_url"], "https://wa.me/919744000001")
        self.assertEqual(payload[0]["average_rating"], 4.5)

    def test_workers_filter_by_verified_and_available_flags(self):
        response = self.client.get(
            reverse("worker-list"),
            {"verified": "true", "available": "true"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()["results"]
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["name"], "Niyas")

    def test_home_data_endpoint_returns_stats(self):
        response = self.client.get(reverse("home-data"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["stats"]["categories"], 2)
        self.assertEqual(payload["stats"]["locations"], 2)
        self.assertEqual(payload["stats"]["workers"], 2)
        self.assertEqual(payload["stats"]["pending_submissions"], 0)

    def test_worker_submission_endpoint_creates_pending_submission(self):
        response = self.client.post(
            reverse("worker-submission-create"),
            {
                "name": "Sameer",
                "phone_number": "+91 9876543210",
                "category": self.electrician.id,
                "city": "Kozhikode",
                "area_name": "Mankavu",
                "pincode": "673007",
                "service_description": "House wiring and inverter work",
                "availability_status": True,
                "consent_to_contact": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        submission = WorkerSubmission.objects.get(name="Sameer")
        self.assertEqual(submission.phone_number, "919876543210")
        self.assertEqual(submission.status, WorkerSubmission.STATUS_PENDING)
        # Worker should be created immediately (unverified)
        self.assertIsNotNone(submission.approved_worker)
        self.assertFalse(submission.approved_worker.is_verified)

    def test_worker_submission_rejects_existing_directory_number(self):
        response = self.client.post(
            reverse("worker-submission-create"),
            {
                "name": "Duplicate",
                "phone_number": "919744000001",
                "category": self.plumber.id,
                "city": "Kozhikode",
                "area_name": "Ramanattukara",
                "pincode": "673633",
                "service_description": "",
                "availability_status": True,
                "consent_to_contact": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_number", response.json())

    def test_worker_detail_endpoint(self):
        response = self.client.get(reverse("worker-detail", kwargs={"pk": self.verified_worker.pk}))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["name"], "Niyas")
        self.assertEqual(payload["average_rating"], 4.5)

    def test_rating_submission_creates_rating(self):
        response = self.client.post(
            reverse("worker-rating-create", kwargs={"pk": self.verified_worker.pk}),
            {"rating": 3},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("average_rating", response.json())

    def test_rating_submission_rejects_invalid_rating(self):
        response = self.client.post(
            reverse("worker-rating-create", kwargs={"pk": self.verified_worker.pk}),
            {"rating": 6},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_rating_submission_returns_404_for_unknown_worker(self):
        response = self.client.post(
            reverse("worker-rating-create", kwargs={"pk": 99999}),
            {"rating": 4},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_submission_approval_creates_worker(self):
        submission = WorkerSubmission.objects.create(
            name="Riyas",
            phone_number="9876543211",
            category=self.electrician,
            city="Kozhikode",
            area_name="Mankavu",
            pincode="673007",
            service_description="Emergency electrician",
            availability_status=True,
            consent_to_contact=True,
        )
        # Pre-create the worker (as the view now does on submission)
        location, _ = Location.objects.get_or_create(
            area_name="Mankavu", pincode="673007", defaults={"city": "Kozhikode"}
        )
        worker = Worker.objects.create(
            phone_number="9876543211",
            name="Riyas",
            category=self.electrician,
            location=location,
            is_verified=False,
        )
        submission.approved_worker = worker
        submission.save(update_fields=["approved_worker"])

        approved_worker = submission.approve()

        self.assertEqual(submission.status, WorkerSubmission.STATUS_APPROVED)
        self.assertTrue(approved_worker.is_verified)
        self.assertTrue(Location.objects.filter(area_name="Mankavu", pincode="673007").exists())
