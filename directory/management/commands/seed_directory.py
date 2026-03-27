from django.core.management.base import BaseCommand

from directory.models import Category, Location, Rating, Worker


# (English name, Malayalam name, icon_url, search_keywords)
CATEGORIES = [
    ("Plumber", "പ്ലംബർ", "https://img.icons8.com/fluency/96/plumbing.png", "plumber plumbing pipe water leak"),
    ("Electrician", "ഇലക്ട്രീഷ്യൻ", "https://img.icons8.com/fluency/96/electrical.png", "electrician electrical wiring"),
    ("Carpenter", "കാർപ്പെന്റർ", "https://img.icons8.com/fluency/96/hammer.png", "carpenter carpentry wood furniture"),
    ("House Cleaner", "ഹൗസ് ക്ലീനർ", "https://img.icons8.com/fluency/96/broom.png", "house cleaner cleaning maid"),
    ("Painter", "പെയിന്റർ", "https://img.icons8.com/fluency/96/paint-palette.png", "painter painting wall"),
    ("AC Technician", "AC ടെക്നീഷ്യൻ", "https://img.icons8.com/fluency/96/air-conditioner.png", "ac technician air conditioner repair"),
    ("Tyre Puncture", "ടയർ പഞ്ചർ", "https://img.icons8.com/emoji/96/automobile.png", "tyre puncture tire repair"),
    ("Taxi Driver", "ടാക്സി ഡ്രൈവർ", "https://img.icons8.com/fluency/96/taxi.png", "taxi driver cab"),
    ("Goods Transport", "ചരക്ക് ഗതാഗതം", "https://img.icons8.com/fluency/96/truck.png", "goods transport lorry truck"),
    ("Tailor", "തയ്യൽക്കാരൻ", "https://img.icons8.com/fluency/96/sewing-machine.png", "tailor stitching sewing"),
    ("Autorickshaw", "ഓട്ടോറിക്ഷ", "https://img.icons8.com/fluency/96/auto-rickshaw.png", "autorickshaw auto rickshaw"),
    ("Welder", "വെൽഡർ", "https://img.icons8.com/emoji/96/hammer-and-wrench.png", "welder welding"),
    ("Mason", "മേസൻ", "https://img.icons8.com/fluency/96/trowel.png", "mason masonry construction"),
    ("Washing Machine Repair", "വാഷിംഗ് മെഷീൻ റിപ്പയർ", "https://img.icons8.com/fluency/96/washing-machine.png", "washing machine repair"),
    ("TV & Electronics Repair", "TV & ഇലക്ട്രോണിക്സ് റിപ്പയർ", "https://img.icons8.com/fluency/96/tv.png", "tv electronics repair television"),
    ("Refrigerator Repair", "റഫ്രിജറേറ്റർ റിപ്പയർ", "https://img.icons8.com/fluency/96/fridge.png", "refrigerator fridge repair"),
    ("Pest Control", "പെസ്റ്റ് കൺട്രോൾ", "https://img.icons8.com/fluency/96/cockroach.png", "pest control cockroach termite"),
    ("Gardener", "തോട്ടക്കാരൻ", "https://img.icons8.com/fluency/96/potted-plant.png", "gardener garden plant"),
    ("Security Guard", "സെക്യൂരിറ്റി ഗാർഡ്", "https://img.icons8.com/fluency/96/policeman-male.png", "security guard watchman"),
    ("Cook", "പാചകക്കാരൻ", "https://img.icons8.com/fluency/96/chef-hat.png", "cook chef cooking"),
    ("Catering", "കേറ്ററിംഗ്", "https://img.icons8.com/fluency/96/restaurant.png", "catering food event"),
    ("Driving Instructor", "ഡ്രൈവിംഗ് ഇൻസ്ട്രക്ടർ", "https://img.icons8.com/fluency/96/driver.png", "driving instructor lesson"),
    ("Courier & Delivery", "കൊറിയർ & ഡെലിവറി", "https://img.icons8.com/emoji/96/motor-scooter.png", "courier delivery parcel"),
    ("Event Decorator", "ഇവന്റ് ഡെക്കറേറ്റർ", "https://img.icons8.com/fluency/96/confetti.png", "event decorator decoration"),
    ("Photographer", "ഫോട്ടോഗ്രാഫർ", "https://img.icons8.com/fluency/96/camera.png", "photographer photography"),
    ("Gas Repair", "ഗ്യാസ് റിപ്പയർ", "https://img.icons8.com/emoji/96/fire.png", "gas repair stove"),
    ("Grass Cutting", "പുല്ല് വെട്ടൽ", "https://img.icons8.com/fluency/96/lawn-mower.png", "grass cutting garden"),
    ("Coconut Tree Climber", "തേങ്ങ കയറുന്നവൻ", "https://img.icons8.com/fluency/96/palm-tree.png", "coconut tree climbing"),
    ("Tree Cutter", "മരം വെട്ടൽ", "https://img.icons8.com/fluency/96/deciduous-tree.png", "tree cutting"),
    ("Water Tank Cleaning", "വെള്ള ടാങ്ക് ക്ലീനിംഗ്", "https://img.icons8.com/fluency/96/water.png", "tank cleaning"),
    ("Septic Tank Cleaning", "സെപ്റ്റിക് ടാങ്ക് ക്ലീനിംഗ്", "https://img.icons8.com/fluency/96/waste.png", "septic cleaning"),
    ("Well Cleaning", "കിണർ ശുചീകരണം", "https://img.icons8.com/fluency/96/well.png", "well cleaning"),
    ("Bike Mechanic", "ബൈക്ക് മെക്കാനിക്", "https://img.icons8.com/fluency/96/motorcycle.png", "bike repair"),
    ("Pump Repair", "വാട്ടർ പമ്പ് റിപ്പയർ", "https://img.icons8.com/fluency/96/pipeline.png", "pump repair"),
    ("House Shifting", "വീട് മാറൽ", "https://img.icons8.com/fluency/96/move.png", "house shifting"),
    ("Scrap Collection", "സ്ക്രാപ്പ് ശേഖരണം", "https://img.icons8.com/fluency/96/recycling.png", "scrap pickup"),
    ("Babysitter", "ബേബിസിറ്റർ", "https://img.icons8.com/fluency/96/baby.png", "babysitting nanny"),
    ("Elder Care", "വയോധിക പരിചരണം", "https://img.icons8.com/fluency/96/elderly-person.png", "elder care"),
]

# (city_en, city_ml, area_en, area_ml, pincode)
LOCATIONS = [
    ("Kozhikode", "കോഴിക്കോട്", "Ramanattukara", "രാമനാട്ടുകര", "673633"),
    ("Kozhikode", "കോഴിക്കോട്", "Feroke", "ഫറോക്ക്", "673631"),
    ("Kozhikode", "കോഴിക്കോട്", "Beypore", "ബേപ്പൂർ", "673015"),
    ("Kozhikode", "കോഴിക്കോട്", "Kallai", "കല്ലായി", "673003"),
    ("Kozhikode", "കോഴിക്കോട്", "Mavoor Road", "മാവൂർ റോഡ്", "673004"),
    ("Kozhikode", "കോഴിക്കോട്", "Palayam", "പാളയം", "673002"),
    ("Kozhikode", "കോഴിക്കോട്", "Nadakkavu", "നാദാപ്പുരം", "673011"),
    ("Kozhikode", "കോഴിക്കോട്", "Chevayur", "ചേവായൂർ", "673017"),
    ("Kozhikode", "കോഴിക്കോട്", "Calicut Medical College", "കോഴിക്കോട് മെഡിക്കൽ കോളേജ്", "673008"),
    ("Kozhikode", "കോഴിക്കോട്", "Mankavu", "മങ്കാവ്", "673007"),
    ("Kozhikode", "കോഴിക്കോട്", "Thiruvambady", "തിരുവമ്പാടി", "673603"),
    ("Kozhikode", "കോഴിക്കോട്", "Kuttichira", "കുറ്റിച്ചിറ", "673001"),
    ("Kozhikode", "കോഴിക്കോട്", "Puthiyara", "പുതിയാര", "673006"),
]

# (English name, Malayalam name, phone, category_en, area, verified, available, ratings)
WORKERS = [
    ("Niyas", "നിയാസ്", "919744000001", "Plumber", "Ramanattukara", True, True, [5, 4, 5]),
    ("Afsal", "അഫ്സൽ", "919744000002", "Electrician", "Feroke", True, True, [4, 4]),
    ("Jabir", "ജാബിർ", "919744000003", "Carpenter", "Beypore", False, True, [5]),
    ("Shameer", "ഷമീർ", "919744000004", "House Cleaner", "Kallai", True, True, [4, 5, 4]),
    ("Suhail", "സുഹൈൽ", "919744000005", "Painter", "Feroke", False, False, [3, 4]),
    ("Rasheed", "റഷീദ്", "919744000006", "AC Technician", "Ramanattukara", True, True, [5, 5]),
    ("Salim", "സലിം", "919744000007", "Tyre Puncture", "Mavoor Road", True, True, [5, 4]),
    ("Biju", "ബിജു", "919744000008", "Taxi Driver", "Palayam", True, True, [4, 5, 4]),
    ("Rajan", "രാജൻ", "919744000009", "Goods Transport", "Beypore", True, True, [4, 4]),
    ("Hamza", "ഹംസ", "919744000010", "Tailor", "Nadakkavu", True, True, [5, 5, 4]),
    ("Suresh", "സുരേഷ്", "919744000011", "Autorickshaw", "Chevayur", False, True, [3, 4]),
    ("Anwar", "അൻവർ", "919744000012", "Welder", "Feroke", True, True, [4, 5]),
    ("Pradeep", "പ്രദീപ്", "919744000013", "Mason", "Kallai", True, True, [5, 4, 5]),
    ("Shaji", "ഷാജി", "919744000014", "Washing Machine Repair", "Ramanattukara", True, True, [4, 4]),
    ("Vineeth", "വിനീത്", "919744000015", "TV & Electronics Repair", "Palayam", True, True, [5, 4]),
    ("Mujeeb", "മുജീബ്", "919744000016", "Refrigerator Repair", "Mavoor Road", False, True, [3, 3]),
    ("Thomas", "തോമസ്", "919744000017", "Pest Control", "Beypore", True, True, [5, 5]),
    ("Ravi", "രവി", "919744000018", "Gardener", "Chevayur", False, True, [4]),
    ("Santhosh", "സന്തോഷ്", "919744000019", "Cook", "Nadakkavu", True, True, [5, 5, 4]),
    ("Firoz", "ഫിറോസ്", "919744000020", "Catering", "Kallai", True, False, [4, 4]),
    ("Deepak", "ദീപക്", "919744000021", "Courier & Delivery", "Feroke", False, True, [3, 4]),
    ("Arun", "അരുൺ", "919744000022", "Photographer", "Palayam", True, True, [5, 4, 5]),
    ("Shibu", "ഷിബു", "919744000023", "Gas Repair", "Mankavu", True, True, [5, 5, 4]),
    ("Rajesh", "രാജേഷ്", "919744000024", "Plumber", "Mankavu", True, True, [4, 4, 5]),
    ("Sunil", "സുനിൽ", "919744000025", "Electrician", "Calicut Medical College", True, True, [5, 4]),
    ("Manoj", "മനോജ്", "919744000026", "Carpenter", "Thiruvambady", True, True, [4, 5, 4]),
    ("Bineesh", "ബിനീഷ്", "919744000027", "Painter", "Kuttichira", True, True, [5, 5]),
    ("Shino", "ഷിനോ", "919744000028", "AC Technician", "Puthiyara", True, True, [4, 4, 5]),
    ("Aslam", "അസ്ലം", "919744000029", "Tailor", "Mankavu", True, True, [5, 4, 4]),
    ("Vineesh", "വിനീഷ്", "919744000030", "Mason", "Calicut Medical College", True, True, [4, 5]),
    ("Pramod", "പ്രമോദ്", "919744000031", "Taxi Driver", "Thiruvambady", True, True, [5, 4, 5]),
    ("Sujith", "സുജിത്", "919744000032", "House Cleaner", "Kuttichira", True, True, [4, 4, 4]),
    ("Noufal", "നൗഫൽ", "919744000033", "Washing Machine Repair", "Puthiyara", True, True, [5, 5, 4]),
    ("Dileep", "ദിലീപ്", "919744000034", "Refrigerator Repair", "Mankavu", True, True, [4, 5]),
    ("Sajeev", "സജീവ്", "919744000035", "Cook", "Calicut Medical College", True, True, [5, 5, 5]),
    ("Midhun", "മിഥുൻ", "919744000036", "Courier & Delivery", "Thiruvambady", True, True, [4, 4]),
    ("Faisal", "ഫൈസൽ", "919744000037", "Gas Repair", "Kuttichira", True, True, [5, 4, 5]),
    ("Sreejith", "ശ്രീജിത്", "919744000038", "Pest Control", "Puthiyara", True, True, [4, 5, 4]),
    ("Anoop", "അനൂപ്", "919744000039", "Welder", "Mankavu", True, True, [5, 4]),
    ("Shafeeq", "ഷഫീഖ്", "919744000040", "Security Guard", "Calicut Medical College", True, True, [4, 4, 5]),
]


class Command(BaseCommand):
    help = "Seed the directory with starter categories, locations, workers, and ratings."

    def handle(self, *args, **options):
        category_map = {}
        for name_en, name_ml, icon_url, keywords in CATEGORIES:
            category, _ = Category.objects.get_or_create(
                name=name_en,
                defaults={"name_ml": name_ml, "icon_url": icon_url, "search_keywords": keywords},
            )
            category.name_ml = name_ml
            category.icon_url = icon_url
            category.search_keywords = keywords
            category.save(update_fields=["name_ml", "icon_url", "search_keywords"])
            category_map[name_en] = category

        location_map = {}
        for city, city_ml, area_name, area_name_ml, pincode in LOCATIONS:
            location, _ = Location.objects.get_or_create(
                area_name=area_name,
                pincode=pincode,
                defaults={"city": city, "city_ml": city_ml, "area_name_ml": area_name_ml},
            )
            location.city_ml = city_ml
            location.area_name_ml = area_name_ml
            location.save(update_fields=["city_ml", "area_name_ml"])
            location_map[area_name] = location

        created_workers = 0
        for name_en, name_ml, phone_number, category_name, area_name, is_verified, is_available, ratings in WORKERS:
            worker, created = Worker.objects.get_or_create(
                phone_number=phone_number,
                defaults={
                    "name": name_en,
                    "name_ml": name_ml,
                    "category": category_map[category_name],
                    "location": location_map[area_name],
                    "is_verified": is_verified,
                    "availability_status": is_available,
                },
            )
            if not created:
                worker.name = name_en
                worker.name_ml = name_ml
                worker.save(update_fields=["name", "name_ml"])

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
