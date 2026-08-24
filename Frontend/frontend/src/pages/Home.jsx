import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  default: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=60",
};

export default function Home() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("");

  // Post-MVP Feature: LocalStorage Favorites State
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorite_services");
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  const toggleFavorite = (serviceId) => {
    let updated;
    if (favorites.includes(serviceId)) {
      updated = favorites.filter((id) => id !== serviceId);
    } else {
      updated = [...favorites, serviceId];
    }
    setFavorites(updated);
    localStorage.setItem("favorite_services", JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Live filter pipeline including favorites
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

    const matchesFavorites = !showFavoritesOnly || favorites.includes(service.id);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesPrice &&
      matchesRating &&
      matchesFavorites
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
      {/* Top Welcome Bar */}
      {token && (
        <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name || user?.full_name ? (user.name || user.full_name).charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-bold text-slate-800">
                  {user?.name || user?.full_name || "Valued User"}{" "}
                  <span className="text-xs font-normal text-slate-400 capitalize">
                    ({user?.role || "Customer"})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(!user?.role || user?.role === "customer") && (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Customer Dashboard →
                </Link>
              )}

              {user?.role === "provider" && (
                <Link
                  to="/provider"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Provider Portal →
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Admin Panel →
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-semibold rounded-xl border border-slate-200 hover:border-red-100 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <section className="bg-linear-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-400/30">
            Quetta's Verified Service Network
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Find Trusted Local Services in Quetta
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Book verified electricians, tutors, plumbers, tailors, and mechanics across Quetta with transparent pricing and real reviews.
          </p>

          {/* Search & Filter Bar */}
          <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-900">
              <input
                type="text"
                placeholder="Search services (e.g. wiring, math)..."
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
                <option value="Shahbaz Town">Shahbaz Town</option>
                <option value="Satellite Town">Satellite Town</option>
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

      {/* Category Pills Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 overflow-x-auto flex gap-2 no-scrollbar">
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

      {/* Service Listings Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {showFavoritesOnly
                ? "Saved Services (Favorites)"
                : selectedCategory === "all"
                ? "Available Services"
                : `${selectedCategory.toUpperCase()} Services`}
            </h2>
            <p className="text-sm text-slate-500">
              Showing {filteredServices.length} listings in Quetta
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{showFavoritesOnly ? "❤️" : "🤍"}</span>
              <span>Favorites ({favorites.length})</span>
            </button>

            {(searchQuery || selectedLocation || priceMax || minRating || selectedCategory !== "all" || showFavoritesOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation("");
                  setPriceMax("");
                  setMinRating("");
                  setSelectedCategory("all");
                  setShowFavoritesOnly(false);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Reset Filters
              </button>
            )}
          </div>
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
              Try modifying your search terms, clearing filters, or browsing other categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const isFav = favorites.includes(service.id);
              const providerPhone = service.provider_phone || "923001234567";
              const whatsappUrl = `https://wa.me/${providerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello! I found your service "${service.title}" on Quetta Services and would like to inquire about booking.`
              )}`;

              return (
                <div
                  key={service.id}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Card Banner Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={service.image_url || getServiceImage(service.category)}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Location Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                      📍 {service.location || "Quetta"}
                    </div>

                    {/* Post-MVP Feature: Favorite Bookmark Button */}
                    <button
                      onClick={() => toggleFavorite(service.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm hover:scale-110 transition-transform"
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFav ? "❤️" : "🤍"}
                    </button>

                    {/* Rating Badge */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                      <span className="text-amber-400">★</span>
                      <span>{service.rating ? Number(service.rating).toFixed(1) : "New"}</span>
                      {service.review_count ? `(${service.review_count})` : ""}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Provider Header with Post-MVP Verified Badge */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-medium text-slate-500">
                          {service.provider_name || "Verified Local Pro"}
                        </span>
                        <span
                          className="inline-flex items-center text-blue-600"
                          title="Verified Quetta Service Provider"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {service.description || "Reliable service available for fast online booking across Quetta."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Starting at</span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          Rs. {Number(service.price).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Post-MVP Feature: WhatsApp Direct Inquire */}
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors flex items-center justify-center"
                          title="Chat with provider on WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.12-.533-1.636-.682-2.698-2.348-2.779-2.458-.08-.109-.663-.881-.663-1.681 0-.8.419-1.194.568-1.355.149-.161.325-.202.434-.202.108 0 .216.002.31.007.099.006.233-.038.365.279.136.326.463 1.13.504 1.213.041.082.069.178.013.288-.055.11-.082.178-.163.273-.08.096-.169.214-.242.287-.081.082-.166.171-.072.332.095.161.42 1.011 1.206 1.71 1.014.903 1.868 1.182 2.133 1.314.265.131.421.11.577-.07.157-.179.673-.784.853-1.053.18-.268.361-.224.605-.134.244.089 1.547.729 1.813.863.266.134.443.2.508.312.065.113.065.656-.079 1.061z" />
                          </svg>
                        </a>

                        {/* Standard Book Now Button */}
                        <Link
                          to={`/services/${service.id}`}
                          className="px-4 py-2 bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}