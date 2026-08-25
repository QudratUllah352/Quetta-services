import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyFavorites, toggleFavorite } from "../api/favorites";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavs = async () => {
    setLoading(true);
    try {
      const res = await getMyFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error("Failed to load favorites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavs();
  }, []);

  const handleRemove = async (serviceId) => {
    try {
      await toggleFavorite(serviceId);
      setFavorites((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          My Saved Services ❤️
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quickly access and book providers you have saved in Quetta.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <span className="text-4xl block mb-2">💔</span>
          <h3 className="text-base font-bold text-slate-800">No saved services yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Browse services and click the "Save" heart to keep them handy here.
          </p>
          <Link
            to="/"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-all"
          >
            Explore Services in Quetta
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    📍 {s.location || "Quetta"}
                  </span>
                  <button
                    onClick={() => handleRemove(s.id)}
                    className="text-rose-500 hover:text-rose-700 text-sm font-bold"
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>

                <Link
                  to={`/services/${s.id}`}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 block"
                >
                  {s.title}
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {s.description || "No description provided."}
                </p>
              </div>

              <div className="p-5 flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                <span className="font-extrabold text-slate-900 text-sm">
                  Rs. {Number(s.price).toLocaleString()}
                </span>
                <Link
                  to={`/services/${s.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  Book Slot →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}