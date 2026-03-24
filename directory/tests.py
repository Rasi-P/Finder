from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

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
        electrician = next(item for item in payload if item["name"] == "Electrician")
        self.assertEqual(plumber["worker_count"], 1)
        self.assertEqual(electrician["worker_count"], 0)

    def test_locations_list_only_areas_with_verified_workers(self):
        response = self.client.get(reverse("location-list"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        results = payload.get("results", payload)
        pincodes = {item["pincode"] for item in results}
        self.assertIn("673633", pincodes)
        self.assertNotIn("673631", pincodes)

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
        self.assertEqual(payload["stats"]["locations"], 1)
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
        body = response.json()
        self.assertEqual(body["phone_number"], "919876543210")
        self.assertIn("worker_id", body)
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
        self.assertEqual(payload["call_clicks"], 0)
        self.assertEqual(payload["whatsapp_clicks"], 0)

    def test_worker_detail_unverified_forbidden_without_phone(self):
        response = self.client.get(reverse("worker-detail", kwargs={"pk": self.unverified_worker.pk}))
        self.assertEqual(response.status_code, 403)

    def test_worker_detail_unverified_forbidden_wrong_phone(self):
        response = self.client.get(
            reverse("worker-detail", kwargs={"pk": self.unverified_worker.pk}),
            {"phone": "919744000001"},
        )
        self.assertEqual(response.status_code, 403)

    def test_worker_detail_unverified_ok_with_matching_phone(self):
        response = self.client.get(
            reverse("worker-detail", kwargs={"pk": self.unverified_worker.pk}),
            {"phone": "+91 9744000002"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Afsal")

    def test_track_call_increments(self):
        self.assertEqual(self.verified_worker.call_clicks, 0)
        response = self.client.post(reverse("worker-track-call", kwargs={"pk": self.verified_worker.pk}))
        self.assertEqual(response.status_code, 204)
        self.verified_worker.refresh_from_db()
        self.assertEqual(self.verified_worker.call_clicks, 1)

    def test_track_whatsapp_increments(self):
        response = self.client.post(reverse("worker-track-whatsapp", kwargs={"pk": self.verified_worker.pk}))
        self.assertEqual(response.status_code, 204)
        self.verified_worker.refresh_from_db()
        self.assertEqual(self.verified_worker.whatsapp_clicks, 1)

    def test_track_call_404_for_unknown_worker(self):
        response = self.client.post(reverse("worker-track-call", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, 404)

    def test_worker_self_patch_updates_with_matching_phone(self):
        response = self.client.patch(
            reverse("worker-self", kwargs={"pk": self.unverified_worker.pk}),
            {
                "phone_number": "919744000002",
                "name": "Afsal Updated",
                "availability_status": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.unverified_worker.refresh_from_db()
        self.assertEqual(self.unverified_worker.name, "Afsal Updated")
        self.assertTrue(self.unverified_worker.availability_status)

    def test_worker_self_patch_forbidden_wrong_phone(self):
        response = self.client.patch(
            reverse("worker-self", kwargs={"pk": self.unverified_worker.pk}),
            {"phone_number": "919744000001", "name": "Hacker"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_worker_self_patch_requires_update_fields(self):
        response = self.client.patch(
            reverse("worker-self", kwargs={"pk": self.unverified_worker.pk}),
            {"phone_number": "919744000002"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_worker_self_delete_removes_worker(self):
        pk = self.unverified_worker.pk
        response = self.client.delete(
            reverse("worker-self", kwargs={"pk": pk}),
            {"phone_number": "919744000002"},
            format="json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Worker.objects.filter(pk=pk).exists())

    def test_rating_submission_creates_rating(self):
        response = self.client.post(
            reverse("worker-rating-create", kwargs={"pk": self.verified_worker.pk}),
            {"rating": 3},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("average_rating", response.json())
        created = Rating.objects.filter(worker=self.verified_worker, rating=3).first()
        self.assertIsNotNone(created)
        self.assertEqual(created.client_ip, "127.0.0.1")

    def test_rating_duplicate_same_ip_returns_409(self):
        url = reverse("worker-rating-create", kwargs={"pk": self.verified_worker.pk})
        first = self.client.post(url, {"rating": 3}, format="json")
        self.assertEqual(first.status_code, 201)
        second = self.client.post(url, {"rating": 5}, format="json")
        self.assertEqual(second.status_code, 409)

    def test_rating_scoped_throttle_enforced(self):
        # Clear throttle history so earlier tests on this IP do not affect the budget.
        cache.clear()
        # DRF binds THROTTLE_RATES on SimpleRateThrottle at import time; patch for this test only.
        prev_rates = dict(SimpleRateThrottle.THROTTLE_RATES)
        SimpleRateThrottle.THROTTLE_RATES = {**prev_rates, "ratings": "1/s"}
        try:
            workers = []
            for i in range(2):
                workers.append(
                    Worker.objects.create(
                        name=f"Throttle Tester {i}",
                        phone_number=f"9199911100{i}",
                        category=self.plumber,
                        location=self.ramanattukara,
                        is_verified=True,
                    )
                )
            response_ok = self.client.post(
                reverse("worker-rating-create", kwargs={"pk": workers[0].pk}),
                {"rating": 5},
                format="json",
            )
            self.assertEqual(response_ok.status_code, 201, response_ok.content)
            response_limited = self.client.post(
                reverse("worker-rating-create", kwargs={"pk": workers[1].pk}),
                {"rating": 5},
                format="json",
            )
            self.assertEqual(response_limited.status_code, 429, response_limited.content)
        finally:
            SimpleRateThrottle.THROTTLE_RATES = prev_rates
            cache.clear()

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

    def test_submission_status_requires_phone(self):
        response = self.client.get(reverse("submission-status"))
        self.assertEqual(response.status_code, 400)

    def test_submission_status_returns_404_when_unknown(self):
        response = self.client.get(reverse("submission-status"), {"phone": "919999999999"})
        self.assertEqual(response.status_code, 404)

    def test_submission_status_returns_pending_then_verified_after_approval(self):
        self.client.post(
            reverse("worker-submission-create"),
            {
                "name": "StatusTest",
                "phone_number": "+91 9887766554",
                "category": self.electrician.id,
                "city": "Kozhikode",
                "area_name": "Mankavu",
                "pincode": "673007",
                "service_description": "Test",
                "availability_status": True,
                "consent_to_contact": True,
            },
            format="json",
        )
        r1 = self.client.get(reverse("submission-status"), {"phone": "+91 9887766554"})
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["status"], WorkerSubmission.STATUS_PENDING)
        self.assertFalse(r1.json()["is_verified"])

        submission = WorkerSubmission.objects.get(name="StatusTest")
        submission.approve()

        r2 = self.client.get(reverse("submission-status"), {"phone": "+91 98877 66554"})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["status"], WorkerSubmission.STATUS_APPROVED)
        self.assertTrue(r2.json()["is_verified"])
