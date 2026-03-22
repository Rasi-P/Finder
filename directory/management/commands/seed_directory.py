from django.core.management.base import BaseCommand

from directory.models import Category, Location, Rating, Worker


CATEGORIES = [
    ("Plumber", "https://img.icons8.com/fluency/96/plumbing.png"),
    ("Electrician", "https://img.icons8.com/fluency/96/electrical.png"),
    ("Carpenter", "https://img.icons8.com/fluency/96/hammer.png"),
    ("House Cleaner", "https://img.icons8.com/fluency/96/broom.png"),
    ("Painter", "https://img.icons8.com/fluency/96/paint-palette.png"),
    ("AC Technician", "https://img.icons8.com/fluency/96/air-conditioner.png"),
]

LOCATIONS = [
    ("Kozhikode", "Ramanattukara", "673633"),
    ("Kozhikode", "Feroke", "673631"),
    ("Kozhikode", "Beypore", "673015"),
    ("Kozhikode", "Kallai", "673003"),
]

WORKERS = [
    ("Niyas", "919744000001", "Plumber", "Ramanattukara", True, True, [5, 4, 5]),
    ("Afsal", "919744000002", "Electrician", "Feroke", True, True, [4, 4]),
    ("Jabir", "919744000003", "Carpenter", "Beypore", False, True, [5]),
    ("Shameer", "919744000004", "House Cleaner", "Kallai", True, True, [4, 5, 4]),
    ("Suhail", "919744000005", "Painter", "Feroke", False, False, [3, 4]),
    ("Rasheed", "919744000006", "AC Technician", "Ramanattukara", True, True, [5, 5]),
]


class Command(BaseCommand):
    help = "Seed the directory with a few starter categories, locations, workers, and ratings."

    def handle(self, *args, **options):
        category_map = {}
        for name, icon_url in CATEGORIES:
            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={"icon_url": icon_url},
            )
            if not category.icon_url and icon_url:
                category.icon_url = icon_url
                category.save(update_fields=["icon_url"])
            category_map[name] = category

        location_map = {}
        for city, area_name, pincode in LOCATIONS:
            location, _ = Location.objects.get_or_create(
                city=city,
                area_name=area_name,
                pincode=pincode,
            )
            location_map[area_name] = location

        created_workers = 0
        for name, phone_number, category_name, area_name, is_verified, is_available, ratings in WORKERS:
            worker, created = Worker.objects.get_or_create(
                phone_number=phone_number,
                defaults={
                    "name": name,
                    "category": category_map[category_name],
                    "location": location_map[area_name],
                    "is_verified": is_verified,
                    "availability_status": is_available,
                },
            )

            if created:
                created_workers += 1

            if not worker.ratings.exists():
                Rating.objects.bulk_create(
                    [Rating(worker=worker, rating=rating) for rating in ratings]
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete. Categories: {Category.objects.count()}, "
                f"Locations: {Location.objects.count()}, Workers created this run: {created_workers}."
            )
        )
