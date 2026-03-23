from django.core.management.base import BaseCommand

from directory.models import Category, Location, Rating, Worker


CATEGORIES = [
    ("Plumber", "https://img.icons8.com/fluency/96/plumbing.png"),
    ("Electrician", "https://img.icons8.com/fluency/96/electrical.png"),
    ("Carpenter", "https://img.icons8.com/fluency/96/hammer.png"),
    ("House Cleaner", "https://img.icons8.com/fluency/96/broom.png"),
    ("Painter", "https://img.icons8.com/fluency/96/paint-palette.png"),
    ("AC Technician", "https://img.icons8.com/fluency/96/air-conditioner.png"),
    ("Tyre Puncture", "https://img.icons8.com/fluency/96/tire.png"),
    ("Taxi Driver", "https://img.icons8.com/fluency/96/taxi.png"),
    ("Goods Transport", "https://img.icons8.com/fluency/96/delivery.png"),
    ("Tailor", "https://img.icons8.com/fluency/96/sewing-machine.png"),
    ("Autorickshaw", "https://img.icons8.com/fluency/96/auto-rickshaw.png"),
    ("Welder", "https://img.icons8.com/fluency/96/welding-mask.png"),
    ("Mason", "https://img.icons8.com/fluency/96/bricklaying.png"),
    ("Washing Machine Repair", "https://img.icons8.com/fluency/96/washing-machine.png"),
    ("TV & Electronics Repair", "https://img.icons8.com/fluency/96/tv.png"),
    ("Refrigerator Repair", "https://img.icons8.com/fluency/96/fridge.png"),
    ("Pest Control", "https://img.icons8.com/fluency/96/pest.png"),
    ("Gardener", "https://img.icons8.com/fluency/96/potted-plant.png"),
    ("Security Guard", "https://img.icons8.com/fluency/96/security-guard.png"),
    ("Cook", "https://img.icons8.com/fluency/96/cooking.png"),
    ("Catering", "https://img.icons8.com/fluency/96/catering.png"),
    ("Driving Instructor", "https://img.icons8.com/fluency/96/driver.png"),
    ("Courier & Delivery", "https://img.icons8.com/fluency/96/delivery-scooter.png"),
    ("Event Decorator", "https://img.icons8.com/fluency/96/confetti.png"),
    ("Photographer", "https://img.icons8.com/fluency/96/camera.png"),
]

LOCATIONS = [
    ("Kozhikode", "Ramanattukara", "673633"),
    ("Kozhikode", "Feroke", "673631"),
    ("Kozhikode", "Beypore", "673015"),
    ("Kozhikode", "Kallai", "673003"),
    ("Kozhikode", "Mavoor Road", "673004"),
    ("Kozhikode", "Palayam", "673002"),
    ("Kozhikode", "Nadakkavu", "673011"),
    ("Kozhikode", "Chevayur", "673017"),
]

WORKERS = [
    ("Niyas", "919744000001", "Plumber", "Ramanattukara", True, True, [5, 4, 5]),
    ("Afsal", "919744000002", "Electrician", "Feroke", True, True, [4, 4]),
    ("Jabir", "919744000003", "Carpenter", "Beypore", False, True, [5]),
    ("Shameer", "919744000004", "House Cleaner", "Kallai", True, True, [4, 5, 4]),
    ("Suhail", "919744000005", "Painter", "Feroke", False, False, [3, 4]),
    ("Rasheed", "919744000006", "AC Technician", "Ramanattukara", True, True, [5, 5]),
    ("Salim", "919744000007", "Tyre Puncture", "Mavoor Road", True, True, [5, 4]),
    ("Biju", "919744000008", "Taxi Driver", "Palayam", True, True, [4, 5, 4]),
    ("Rajan", "919744000009", "Goods Transport", "Beypore", True, True, [4, 4]),
    ("Hamza", "919744000010", "Tailor", "Nadakkavu", True, True, [5, 5, 4]),
    ("Suresh", "919744000011", "Autorickshaw", "Chevayur", False, True, [3, 4]),
    ("Anwar", "919744000012", "Welder", "Feroke", True, True, [4, 5]),
    ("Pradeep", "919744000013", "Mason", "Kallai", True, True, [5, 4, 5]),
    ("Shaji", "919744000014", "Washing Machine Repair", "Ramanattukara", True, True, [4, 4]),
    ("Vineeth", "919744000015", "TV & Electronics Repair", "Palayam", True, True, [5, 4]),
    ("Mujeeb", "919744000016", "Refrigerator Repair", "Mavoor Road", False, True, [3, 3]),
    ("Thomas", "919744000017", "Pest Control", "Beypore", True, True, [5, 5]),
    ("Ravi", "919744000018", "Gardener", "Chevayur", False, True, [4]),
    ("Santhosh", "919744000019", "Cook", "Nadakkavu", True, True, [5, 5, 4]),
    ("Firoz", "919744000020", "Catering", "Kallai", True, False, [4, 4]),
    ("Deepak", "919744000021", "Courier & Delivery", "Feroke", False, True, [3, 4]),
    ("Arun", "919744000022", "Photographer", "Palayam", True, True, [5, 4, 5]),
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
                area_name=area_name,
                pincode=pincode,
                defaults={"city": city},
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
