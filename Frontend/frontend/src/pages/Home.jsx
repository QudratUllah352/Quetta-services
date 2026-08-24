import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

// Default icons mapped by category name keywords
const ICONS_MAP = {
  electric: "⚡",
  plumb: "🔧",
  tutor: "📚",
  home: "🧹",
  computer: "💻",
  design: "🎨",
  tailor: "✂️",
  mechanic: "🚗",
  default: "✨",
};

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
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.allSettled([
        axios.get("/services"),
        axios.get("/categories"),
      ]);

      if (servicesRes.status === "fulfilled") {
        setServices(servicesRes.value.data || []);
      }
      if (categoriesRes.status === "fulfilled") {
        setCategories(categoriesRes.value.data || []);
      }
    } catch (err) {
      console.error("Error loading initial marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to resolve icon
  const getCategoryIcon = (catName) => {
    const lower = (catName || "").toLowerCase();
    for (const [key, icon] of Object.entries(ICONS_MAP)) {
      if (lower.includes(key)) return icon;
    }
    return ICONS_MAP.default;
  };

  // Helper to resolve image
  const getServiceImage = (service) => {
    const text = `${service.title || ""} ${service.category?.name || service.category || ""} ${service.description || ""}`.toLowerCase();
    for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
      if (text.includes(key)) return url;
    }
    return CATEGORY_IMAGES.default;
  };

  // Robust Filter matching both ID, Object, and string representations
  const filteredServices = services.filter((service) => {
    const sTitle = (service.title || "").toLowerCase();
    const sDesc = (service.description || "").toLowerCase();
    const sLoc = (service.location || "").toLowerCase();

    // 1. Search Query
    const matchesSearch =
      !searchQuery ||
      sTitle.includes(searchQuery.toLowerCase()) ||
      sDesc.includes(searchQuery.toLowerCase());

    // 2. Category Match: checks ID, nested category object name, or category string
    let matchesCategory = selectedCategory === "all";
    if (!matchesCategory) {
      const catIdMatch =
        String(service.category_id) === String(selectedCategory) ||
        String(service.category?.id) === String(selectedCategory);

      const catNameMatch =
        (service.category?.name || service.category || "")
          .toLowerCase()
          .includes(String(selectedCategory).toLowerCase());

      matchesCategory = catIdMatch || catNameMatch;
    }

    // 3. Location Match
    const matchesLocation =
      !selectedLocation || sLoc.includes(selectedLocation.toLowerCase());

    // 4. Price Match
    const matchesPrice = !priceMax || Number(service.price) <= Number(priceMax);

    // 5. Rating Match
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

  // Fallback categories if database has no categories endpoint populated yet
  const displayCategories =
    categories.length > 0
      ? categories
      : [
          { id: "Electrician", name: "Electricians" },
          { id: "Plumber", name: "Plumbers" },
          { id: "Tutor", name: "Tutors" },
          { id: "Home Services", name: "Home Services" },
          { id: "Computer Services", name: "Computer Services" },
          { id: "Graphic Designer", name: "Graphic Designers" },
          { id: "Tailor", name: "Tailors" },
          { id: "Mechanic", name: "Mechanics" },
        ];

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

          {/* Interactive Filter Box
          <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-900">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations in Quetta</option>
                <option value="Jinnah Town">Jinnah Town</option>
                <option value="Quetta Cantt">Quetta Cantt</option>
                <option value="Samungli Road">Samungli Road</option>
                <option value="Brewery Road">Brewery Road</option>
                <option value="Nawan Killi">Nawan Killi</option>
                <option value="Airport Road">Airport Road</option>
              </select>

              <input
                type="number"
                placeholder="Max Budget (PKR)"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rating</option>
                <option value="4">★ 4.0 & above</option>
                <option value="4.5">★ 4.5 & above</option>
                <option value="5">★ 5.0 only</option>
              </select>
            </div>
          </div> */}
        </div>
      </section>

      {/* Category Pills Slider */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 overflow-x-auto flex gap-2">
          {/* All Categories Button */}
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>✨</span>
            <span>All Categories</span>
          </button>

          {/* Dynamic Categories from DB */}
          {displayCategories.map((cat) => {
            const catKey = cat.id || cat.name;
            const isActive = String(selectedCategory) === String(catKey);
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span>{getCategoryIcon(cat.name)}</span>
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
            <h2 className="text-xl font-bold text-slate-800">Available Services</h2>
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
              Try clicking "All Categories" or resetting your filters.
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
                      className="px-4 py-2 bg-slate-900 group-hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                    >
                      Book Now
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