import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

from directory.models import WorkerSubmission

s = WorkerSubmission.objects.get(name="jomy")
s.status = "pending"
s.reviewed_at = None
s.approved_worker = None
s.save(update_fields=["status", "reviewed_at", "approved_worker"])
try:
    w = s.approve()
    print(f"OK: {w.name} | {w.phone_number} | {w.location}")
except Exception as e:
    print(f"FAIL: {e}")
