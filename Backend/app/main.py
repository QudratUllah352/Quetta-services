from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import settings
from app.routers import (
    auth,
    services,
    bookings,
    reviews,
    admin,
    reports,
    availability,
    notifications,
    favorites,
)

app = FastAPI(title="Quetta Services API")

# List all valid frontend origins (both localhost and 127.0.0.1 on Vite/React ports)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Include the production FRONTEND_URL from settings if configured
if getattr(settings, "FRONTEND_URL", None) and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all application routers
app.include_router(auth.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(availability.router)
app.include_router(notifications.router)
app.include_router(favorites.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Quetta Services API"}