import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

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
  electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60",
  plumber: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=60",
  tutor: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60",
  computer: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60",
  mechanic: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=60",
  tailor: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=60",
  default: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=60",
};

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("");

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
    const matchesSearch =
      service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      service.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesLocation =
      !selectedLocation ||
      service.location?.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesPrice = !priceMax || Number(service.price) <= Number(priceMax);

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

  const getServiceImage = (category) => {
    const key = category?.toLowerCase() || "";
    for (const [catKey, url] of Object.entries(CATEGORY_IMAGES)) {
      if (key.includes(catKey)) return url;
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

          {/* Interactive Filter Box */}
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
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
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
              {selectedCategory === "all" ? "Available Services" : `${selectedCategory.toUpperCase()} Services`}
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
              Try modifying your search terms, removing filters, or choosing another category.
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
                    src={service.image_url || getServiceImage(service.category)}
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