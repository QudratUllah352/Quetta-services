"""
Seed demo data for Quetta Services.

Creates, against a RUNNING backend:
  - 1 admin
  - 8 providers        (guide asks for 5-10)
  - 12 customers       (guide asks for 10+)
  - 8 service categories (guide asks for at least 8 - uses the exact names
    listed in Section 21 of the guide)
  - 24 services        (guide asks for 20+)
  - ~30 bookings spread across pending / confirmed / completed / cancelled
  - 22 reviews on completed bookings (guide asks for 20+)

All names, emails, and phone numbers are fake/demo data - nothing here
identifies a real person, per the guide's explicit instruction.

Usage:
    cd backend
    uvicorn app.main:app --reload &          # backend must be running
    python scripts/seed_demo_data.py
"""

import os
import random
from datetime import datetime, timedelta

import requests

BASE_URL = os.environ.get("SEED_API_URL", "http://127.0.0.1:8000")

# --- Fake demo data pools (not real people) ---

PROVIDER_NAMES = [
    "Ayesha Baloch", "Usman Tareen", "Hina Raisani", "Zeeshan Achakzai",
    "Nadia Kakar", "Fahad Bugti", "Sana Marri", "Imran Domki",
]
CUSTOMER_NAMES = [
    "Bilal Panezai", "Sadia Lehri", "Kamran Sarparah", "Mehwish Rind",
    "Adnan Zehri", "Farah Nousherwani", "Waqas Mengal", "Rabia Jamali",
    "Tariq Khilji", "Sobia Umrani", "Junaid Gichki", "Nimra Buledi",
]
LOCATIONS = ["Quetta Cantt", "Sariab Road", "Jinnah Town", "Satellite Town",
             "Airport Road", "Brewery Road", "Samungli Road"]

CATEGORIES = [
    ("Tutors", "Academic tutoring for school and college students"),
    ("Electricians", "Home and office electrical repair and installation"),
    ("Plumbers", "Pipe, fixture, and water system repair"),
    ("Tailors", "Custom stitching and clothing alterations"),
    ("Mechanics", "Car and motorcycle repair services"),
    ("Graphic Designers", "Logos, branding, and print design"),
    ("Computer Services", "PC repair, software setup, and IT support"),
    ("Home Services", "Cleaning, moving, and general household help"),
]

SERVICE_TEMPLATES = {
    "Tutors": ["Math Tutoring (O/A Level)", "English Language Coaching", "Physics & Chemistry Tuition", "Quran & Islamiyat Classes"],
    "Electricians": ["Home Wiring Repair", "Fan & Light Installation", "Generator Setup & Repair"],
    "Plumbers": ["Bathroom Fitting Repair", "Water Tank Installation", "Pipe Leak Fixing"],
    "Tailors": ["Custom Shalwar Kameez Stitching", "Dress Alterations", "Uniform Stitching"],
    "Mechanics": ["Car Engine Diagnostics", "Motorcycle Servicing", "AC Repair for Vehicles"],
    "Graphic Designers": ["Logo Design", "Business Card Design", "Social Media Graphics"],
    "Computer Services": ["Laptop Repair", "Windows Installation", "Home Network Setup"],
    "Home Services": ["House Deep Cleaning", "Furniture Moving", "Pest Control"],
}

REVIEW_COMMENTS_POSITIVE = [
    "Very professional and on time.", "Great work, highly recommend.",
    "Fixed the issue quickly.", "Fair pricing and good communication.",
]
REVIEW_COMMENTS_MIXED = [
    "Decent work but arrived late.", "Okay service, could be better.",
    "Got the job done, nothing special.",
]


def register(name, email, role, phone="", location=""):
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name, "email": email, "password": "demo12345",
        "role": role, "phone": phone, "location": location,
    })
    if r.status_code not in (201, 400):  # 400 = already exists, fine on re-run
        print(f"  WARN register {email}: {r.status_code} {r.text[:150]}")


def login(email):
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "demo12345"})
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def main():
    print(f"Seeding demo data against {BASE_URL} ...")
    try:
        requests.get(BASE_URL, timeout=3)
    except requests.exceptions.ConnectionError:
        print("ERROR: backend is not reachable. Start it first:")
        print("  cd backend && uvicorn app.main:app --reload")
        return

    # 1 admin
    register("Demo Admin", "admin@quettaservices-demo.com", "admin", "0300-0000000", "Quetta")
    admin_h = login("admin@quettaservices-demo.com")
    print("Admin ready.")

    # 8 categories (Section 21's exact names)
    cat_ids = {}
    for name, desc in CATEGORIES:
        r = requests.post(f"{BASE_URL}/admin/categories", json={"name": name, "description": desc}, headers=admin_h)
        if r.status_code == 201:
            cat_ids[name] = r.json()["id"]
        elif r.status_code == 400:
            # already exists - fetch id
            existing = requests.get(f"{BASE_URL}/services/categories").json()
            cat_ids[name] = next(c["id"] for c in existing if c["name"] == name)
    print(f"{len(cat_ids)} categories ready.")

    # 8 providers
    provider_headers = []
    for i, name in enumerate(PROVIDER_NAMES):
        email = f"provider{i+1}@quettaservices-demo.com"
        register(name, email, "provider", f"0301-100{i:04d}", random.choice(LOCATIONS))
        provider_headers.append(login(email))
    print(f"{len(provider_headers)} providers ready.")

    # 12 customers
    customer_headers = []
    for i, name in enumerate(CUSTOMER_NAMES):
        email = f"customer{i+1}@quettaservices-demo.com"
        register(name, email, "customer", f"0302-200{i:04d}", random.choice(LOCATIONS))
        customer_headers.append(login(email))
    print(f"{len(customer_headers)} customers ready.")

    # 24+ services, spread across providers and categories
    service_ids = []
    for cat_name, titles in SERVICE_TEMPLATES.items():
        for title in titles:
            prov_h = random.choice(provider_headers)
            price = random.choice([500, 800, 1000, 1500, 2000, 2500, 3000])
            r = requests.post(f"{BASE_URL}/services", json={
                "title": title,
                "description": f"Reliable {title.lower()} in Quetta. Book online for quick service.",
                "price": price,
                "location": random.choice(LOCATIONS),
                "category_id": cat_ids[cat_name],
            }, headers=prov_h)
            if r.status_code == 201:
                service_ids.append((r.json()["id"], prov_h))
    print(f"{len(service_ids)} services created.")

    # Bookings spread across statuses, with reviews on completed ones
    booking_count = 0
    review_count = 0
    base_date = datetime(2026, 9, 1)

    for i in range(45):
        service_id, prov_h = random.choice(service_ids)
        cust_h = random.choice(customer_headers)
        booking_date = (base_date + timedelta(days=random.randint(0, 30), hours=random.randint(8, 18))).isoformat()

        r = requests.post(f"{BASE_URL}/bookings", json={
            "service_id": service_id, "booking_date": booking_date,
            "notes": "" if random.random() > 0.3 else "Please call before arriving.",
        }, headers=cust_h)
        if r.status_code != 201:
            continue
        booking_id = r.json()["id"]
        booking_count += 1

        # Distribute across statuses: ~20% stay pending, ~15% confirmed,
        # ~15% cancelled, ~50% go all the way to completed (+ review) -
        # weighted toward completed so there's a healthy review count too.
        roll = random.random()
        if roll < 0.20:
            pass  # stays pending
        elif roll < 0.35:
            requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "confirmed"}, headers=prov_h)
        elif roll < 0.50:
            requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "confirmed"}, headers=prov_h)
            requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "cancelled"}, headers=prov_h)
        else:
            requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "confirmed"}, headers=prov_h)
            requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "completed"}, headers=prov_h)

            rating = random.choice([5, 5, 4, 4, 4, 3, 5])
            comment = random.choice(REVIEW_COMMENTS_POSITIVE if rating >= 4 else REVIEW_COMMENTS_MIXED)
            rr = requests.post(f"{BASE_URL}/reviews", json={
                "booking_id": booking_id, "rating": rating, "comment": comment,
            }, headers=cust_h)
            if rr.status_code == 201:
                review_count += 1

    print(f"{booking_count} bookings created across pending/confirmed/completed/cancelled.")
    print(f"{review_count} reviews created on completed bookings.")

    # Top up if we came in under the guide's 20+ review minimum - just
    # push a few more bookings straight to completed+reviewed.
    attempts = 0
    while review_count < 22 and attempts < 30:
        attempts += 1
        service_id, prov_h = random.choice(service_ids)
        cust_h = random.choice(customer_headers)
        booking_date = (base_date + timedelta(days=random.randint(0, 30), hours=random.randint(8, 18))).isoformat()
        r = requests.post(f"{BASE_URL}/bookings", json={"service_id": service_id, "booking_date": booking_date}, headers=cust_h)
        if r.status_code != 201:
            continue
        booking_id = r.json()["id"]
        booking_count += 1
        requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "confirmed"}, headers=prov_h)
        requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "completed"}, headers=prov_h)
        rating = random.choice([5, 5, 4, 4, 3])
        comment = random.choice(REVIEW_COMMENTS_POSITIVE if rating >= 4 else REVIEW_COMMENTS_MIXED)
        rr = requests.post(f"{BASE_URL}/reviews", json={"booking_id": booking_id, "rating": rating, "comment": comment}, headers=cust_h)
        if rr.status_code == 201:
            review_count += 1

    print(f"(after top-up) {booking_count} total bookings, {review_count} total reviews.")
    print("\nSeed complete.")
    print(f"  Admin login:    admin@quettaservices-demo.com / demo12345")
    print(f"  Provider login: provider1@quettaservices-demo.com / demo12345")
    print(f"  Customer login: customer1@quettaservices-demo.com / demo12345")


if __name__ == "__main__":
    main()