from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import settings
from app.routers import auth, services, bookings, reviews, admin, reports

app = FastAPI(title="Quetta Services API")

# CORS: only allow the configured frontend origin(s), not "*".
# In production, FRONTEND_URL should be the deployed Static Web Apps domain,
# not localhost (Section 27: "Production CORS allowed origins").
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Quetta Services API"}