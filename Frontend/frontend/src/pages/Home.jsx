import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: "✨" },
  { id: "electrician", name: "Electricians", icon: "⚡" },
  { id: "plumber", name: "Plumbers", icon: "🔧" },
  { id: "tutor", name: "Tutors", icon: "📚" },
  { id: "home-services", name: "Home Services", icon: "🧹" },
  { id: "computer", name: "Computer Services", icon: "💻" },
  { id: "graphic-design", name: "Graphic Designers", icon: "🎨" },
  { id: "tailor", name: "Tailors", icon: "✂️" },
  { id: "mechanic", name: "Mechanics", icon: "🚗" },
];

const CATEGORY_IMAGES = {
  electric: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60",
  plumb: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=60",
  tutor: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60",
  computer: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60",
  mechanic: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=60",
  tailor: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=60",
  default: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=60",
};

const TESTIMONIALS = [
  {
    name: "Dr. Farooq Kasi",
    area: "Jinnah Town, Quetta",
    rating: 5,
    comment: "Found an emergency plumber within 20 minutes for our water tank line. Completely transparent pricing with zero hassle.",
    initials: "FK",
  },
  {
    name: "Zainab Mengal",
    area: "Samungli Road",
    rating: 5,
    comment: "Hired an O-Level chemistry tutor for my son. The verified credentials gave us complete peace of mind. Excellent platform!",
    initials: "ZM",
  },
  {
    name: "Taimoor Shah",
    area: "Quetta Cantt",
    rating: 5,
    comment: "Got my solar inverter system repaired by an electrician from Brewery Road. Very professional and polite.",
    initials: "TS",
  },
];

export default function Home() {
  const { user, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isProvider = token && user?.role?.toLowerCase() === "provider";

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/services");
      setServices(res.data || []);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const sTitle = (service.title || "").toLowerCase();
    const sDesc = (service.description || "").toLowerCase();
    const sCat = (service.category?.name || service.category || "").toLowerCase();

    let matchesCategory = selectedCategory === "all";
    if (!matchesCategory) {
      if (selectedCategory === "electrician") {
        matchesCategory = sCat.includes("elect") || sTitle.includes("wiring") || sTitle.includes("electric") || sTitle.includes("generator") || sTitle.includes("fan") || sTitle.includes("light");
      } else if (selectedCategory === "plumber") {
        matchesCategory = sCat.includes("plumb") || sTitle.includes("plumb") || sTitle.includes("pipe") || sTitle.includes("tank") || sTitle.includes("fitting") || sTitle.includes("leak") || sTitle.includes("bathroom");
      } else if (selectedCategory === "tutor") {
        matchesCategory = sCat.includes("tutor") || sCat.includes("tuition") || sTitle.includes("tutoring") || sTitle.includes("tuition") || sTitle.includes("math") || sTitle.includes("english") || sTitle.includes("physics") || sTitle.includes("chemistry") || sTitle.includes("quran") || sTitle.includes("classes");
      } else if (selectedCategory === "computer") {
        matchesCategory = sCat.includes("computer") || sTitle.includes("computer") || sTitle.includes("pc") || sTitle.includes("laptop") || sTitle.includes("windows") || sTitle.includes("software");
      } else if (selectedCategory === "graphic-design") {
        matchesCategory = sCat.includes("graphic") || sCat.includes("design") || sTitle.includes("design") || sTitle.includes("logo") || sTitle.includes("photoshop");
      } else if (selectedCategory === "tailor") {
        matchesCategory = sCat.includes("tailor") || sTitle.includes("tailor") || sTitle.includes("suit") || sTitle.includes("stitch") || sTitle.includes("cloth");
      } else if (selectedCategory === "mechanic") {
        matchesCategory = sCat.includes("mechanic") || sTitle.includes("mechanic") || sTitle.includes("car") || sTitle.includes("engine") || sTitle.includes("auto") || sTitle.includes("bike");
      } else if (selectedCategory === "home-services") {
        matchesCategory = sCat.includes("home") || sTitle.includes("home") || sTitle.includes("clean") || sTitle.includes("repair");
      }
    }

    return matchesCategory;
  });

  const getServiceImage = (service) => {
    const text = `${service.title || ""} ${service.description || ""}`.toLowerCase();
    for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
      if (text.includes(key)) return url;
    }
    return CATEGORY_IMAGES.default;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        {/* Clean Hero Section */}
        <section className="bg-linear-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-5 border border-blue-400/30">
              Quetta's Verified Service Network
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Find Trusted Local Services in Quetta
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Book top-rated electricians, tutors, plumbers, tailors, and mechanics across Quetta with transparent pricing and real reviews.
            </p>
          </div>
        </section>

        {/* Provider Shortcut Banner */}
        {isProvider && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛠️</span>
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Welcome to Provider Mode ({user?.name || user?.full_name || "Provider"})
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Manage your service listings, view incoming client appointments, and update job progress.
                  </p>
                </div>
              </div>
              <Link
                to="/provider"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs whitespace-nowrap"
              >
                Open Provider Portal →
              </Link>
            </div>
          </section>
        )}

        {/* Category Pills Slider */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 overflow-x-auto flex gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Trust & Verification Badges Bar */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                🛡️
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">CNIC Verified Pros</h4>
                <p className="text-xs text-slate-500 mt-0.5">Background-checked technicians across Quetta</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                💰
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Upfront Fixed Pricing</h4>
                <p className="text-xs text-slate-500 mt-0.5">No hidden inspection costs or surprise fees</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Same-Day Availability</h4>
                <p className="text-xs text-slate-500 mt-0.5">Quick booking across Cantt, Jinnah Town & more</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {selectedCategory === "all"
                  ? "Available Services"
                  : `${CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Services"}`}
              </h2>
              <p className="text-sm text-slate-500">
                Showing {filteredServices.length} verified listings in Quetta
              </p>
            </div>

            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Reset Category
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-4 text-base font-semibold text-slate-800">No services found in this category</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try selecting "All Categories" to view available listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={service.image_url || getServiceImage(service)}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                      {service.location || "Quetta"}
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                      <span className="text-amber-400">★</span>
                      <span>{service.rating ? Number(service.rating).toFixed(1) : "5.0"}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title + Verification Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {service.title}
                        </h3>
                        {service.provider?.verification_status === "verified" && (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"
                            title="CNIC Verified Provider"
                          >
                            <span>✓</span> Verified Pro
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {service.description || "Reliable local service available for instant online booking across Quetta."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Starting at</span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          Rs. {Number(service.price).toLocaleString()}
                        </span>
                      </div>

                      <Link
                        to={`/services/${service.id}`}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors shadow-sm ${
                          isProvider
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-slate-900 group-hover:bg-blue-600"
                        }`}
                      >
                        {isProvider ? "View Details" : "Book Now"}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* "How It Works" 3-Step Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How QuettaServices Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Simple 3-step process to get your home tasks and repairs handled effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Choose a Local Service</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Filter through verified electricians, plumbers, and tutors by neighborhood and budget.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-black mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Schedule & Confirm</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Pick your preferred time and provide notes. The provider confirms the appointment.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Job Done & Leave Review</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Get the job completed to your satisfaction and leave a review for the community.
              </p>
            </div>
          </div>
        </section>

        {/* Customer Testimonials Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Real Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Trusted by Families in Quetta
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "{t.comment}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider Recruitment CTA Banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-16">
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-400/30">
                Join Our Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Are You a Skilled Professional in Quetta?
              </h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Register as a service provider today. Reach hundreds of customers across Quetta Cantt, Jinnah Town, and Brewery Road with zero upfront fees.
              </p>
            </div>

            <Link
              to="/register"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 whitespace-nowrap"
            >
              Apply as a Provider →
            </Link>
          </div>
        </section>
      </div>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  Q
                </div>
                <span className="text-base font-bold text-slate-900">
                  Quetta<span className="text-blue-600">Services</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Quetta's trusted marketplace for on-demand home maintenance, tutors, electricians, and mechanics.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Services
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><button onClick={() => setSelectedCategory("electrician")} className="hover:text-blue-600">Electricians in Quetta</button></li>
                <li><button onClick={() => setSelectedCategory("plumber")} className="hover:text-blue-600">Plumbing Services</button></li>
                <li><button onClick={() => setSelectedCategory("tutor")} className="hover:text-blue-600">Home & Online Tutors</button></li>
                <li><button onClick={() => setSelectedCategory("mechanic")} className="hover:text-blue-600">Car & Bike Mechanics</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Popular Locations
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>Jinnah Town & Shahbaz Town</li>
                <li>Quetta Cantt & Staff College</li>
                <li>Samungli Road & Airport Road</li>
                <li>Brewery Road & Nawan Killi</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Get Started
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><Link to="/login" className="hover:text-blue-600">Log In to Account</Link></li>
                <li><Link to="/register" className="hover:text-blue-600">Register as a Customer</Link></li>
                <li><Link to="/register" className="hover:text-blue-600">Become a Verified Provider</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} QuettaServices Marketplace. All rights reserved.</p>
            <p className="flex gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}