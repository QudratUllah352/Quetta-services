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

export default function Home() {
  const { user, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("");

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

  // Live filter matching against title, description, location, price, and rating
  const filteredServices = services.filter((service) => {
    const sTitle = (service.title || "").toLowerCase();
    const sDesc = (service.description || "").toLowerCase();
    const sLoc = (service.location || "").toLowerCase();
    const sCat = (service.category?.name || service.category || "").toLowerCase();

    // 1. Text Search Filter
    const matchesSearch =
      !searchQuery ||
      sTitle.includes(searchQuery.toLowerCase()) ||
      sDesc.includes(searchQuery.toLowerCase());

    // 2. Category Filter (Matches ID, category name, title keywords, or descriptions)
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

    // 3. Location Filter
    const matchesLocation =
      !selectedLocation || sLoc.includes(selectedLocation.toLowerCase());

    // 4. Price Filter
    const matchesPrice = !priceMax || Number(service.price) <= Number(priceMax);

    // 5. Rating Filter
    const matchesRating =
      !minRating || Number(service.rating || 0) >= Number(minRating);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesPrice &&
      matchesRating
    );
  });

  const getServiceImage = (service) => {
    const text = `${service.title || ""} ${service.description || ""}`.toLowerCase();
    for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
      if (text.includes(key)) return url;
    }
    return CATEGORY_IMAGES.default;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-400/30">
            Quetta's Verified Service Network
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Find Trusted Local Services in Quetta
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Book top-rated electricians, tutors, plumbers, tailors, and mechanics across Quetta with transparent pricing and real reviews.
          </p>
        </div>
      </section>

      {/* Provider Quick-Action Banner */}
      {isProvider && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Welcome to Provider Mode ({user?.name || user?.full_name || "Provider"})
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Manage your listings, accept new customer orders, and update booking progress.
                </p>
              </div>
            </div>
            <Link
              to="/provider"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap"
            >
              Open Provider Portal →
            </Link>
          </div>
        </section>
      )}

      {/* Category Pills Slider */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 overflow-x-auto flex gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
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

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {selectedCategory === "all" ? "Available Services" : `${CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Services"}`}
            </h2>
            <p className="text-sm text-slate-500">
              Showing {filteredServices.length} verified listings in Quetta
            </p>
          </div>

          {(searchQuery || selectedLocation || priceMax || minRating || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLocation("");
                setPriceMax("");
                setMinRating("");
                setSelectedCategory("all");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Reset Filters
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
            <h3 className="mt-4 text-base font-semibold text-slate-800">No matching services found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try clicking "All Categories" or resetting your search filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Banner */}
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

                {/* Info & Action */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
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
    </div>
  );
}