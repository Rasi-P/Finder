# Finder MVP

Hyper-local worker directory built with Django REST Framework and React.

## Stack

- Backend: Django, Django REST Framework, SQLite for local development
- Frontend: React with Vite

## Backend setup

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_directory
.\venv\Scripts\python.exe manage.py runserver
```

Backend base URL: `http://127.0.0.1:8000/api/`

Useful endpoints:

- `GET /api/home/`
- `GET /api/categories/`
- `GET /api/locations/?q=feroke`
- `GET /api/workers/?category=Plumber&pincode=673633&verified=true&available=true`
- `POST /api/worker-submissions/`

## Frontend setup

```powershell
cd .\frontend
npm.cmd install
npm.cmd run dev
```

Frontend dev URL: `http://127.0.0.1:5173`

If needed, copy `.env.example` to `.env` and change `VITE_API_BASE_URL`.

## Worker Self-Submission

Workers can submit their own details from the frontend form at `/join`.

- Submissions are saved as pending records.
- An unverified worker listing is created immediately so they appear in the directory.
- Review submissions in Django Admin under `Worker submissions`.
- Use the **Approve** action to verify the listing.
- Workers can update or delete their own listing from `/workers/:id` using their phone number as proof of ownership.
- Update requests go through admin approval before taking effect.

## Bilingual Support (English + Malayalam)

- All categories, locations, and worker names support English and Malayalam fields.
- The UI has a language toggle (EN / ML) on every page.
- On the registration form, typing an English name and tabbing out auto-fills the Malayalam field via Google Input Tools transliteration.
- Typing Malayalam first copies it into the English field (the backend detects Malayalam script and handles it correctly).

## Verification

```powershell
.\venv\Scripts\python.exe manage.py test
cd .\frontend
npm.cmd run build
```
