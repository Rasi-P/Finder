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

Workers can now submit their own details from the frontend form.

- Submissions are saved as pending records.
- Review them in Django Admin under `Worker submissions`.
- Use the admin action to approve selected submissions and create live worker listings.

## Verification

```powershell
.\venv\Scripts\python.exe manage.py test
cd .\frontend
npm.cmd run build
```
