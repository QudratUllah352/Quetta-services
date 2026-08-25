import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderProfile() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/services/provider-profile/${id}`);
        setProvider(res.data);
      } catch {
        setError("Provider profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-100 rounded-3xl animate-pulse lg:col-span-2" />
          <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-4xl mb-3">🛠️</span>
        <h2 className="text-xl font-bold text-slate-900">{error || "Provider not found"}</h2>
        <Link to="/" className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isVerified = provider.verification_status?.toLowerCase() === "verified";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Business Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={
                  provider.profile_picture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=0D8ABC&color=fff&size=128`
                }
                alt={provider.name}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-white shadow-md ring-4 ring-slate-100"
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {provider.name}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      <span className="text-blue-500">✓</span> Verified Business
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-2 flex-wrap">
                  <span>📍 {provider.location_area}</span>
                  <span>💼 {provider.years_experience} Years Experience</span>
                  <span className="text-amber-500 font-bold">
                    ★ {provider.average_rating} ({provider.total_reviews} reviews)
                  </span>
                </div>

                <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {provider.response_time_str}
                </p>
              </div>
            </div>

            {/* Direct Contact Button */}
            {provider.phone_whatsapp && (
              <a
                href={`https://wa.me/${provider.phone_whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>💬 WhatsApp Provider</span>
              </a>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed Jobs</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">✅ {provider.completed_jobs_count}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rating Score</span>
              <p className="text-xl font-black text-amber-500 mt-0.5">★ {provider.average_rating}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Services</span>
              <p className="text-xl font-black text-blue-600 mt-0.5">🛠️ {provider.services.length}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verified Identity</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{isVerified ? "🛡️ Yes" : "⏳ Pending"}</p>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Services and Reviews */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About / Bio */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About the Business</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {provider.bio}
              </p>
            </div>

            {/* Offered Services */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Services Offered</h2>
              
              {provider.services.length === 0 ? (
                <p className="text-xs text-slate-400">No active services listed right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {provider.services.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{s.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-emerald-600">
                          Rs. {Number(s.price).toLocaleString()}
                        </span>
                        <Link
                          to={`/services/${s.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                        >
                          Book Slot →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Reviews Feed */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Client Reviews ({provider.reviews.length})
              </h2>

              {provider.reviews.length === 0 ? (
                <p className="text-xs text-slate-400">No client reviews yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {provider.reviews.map((r) => (
                    <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-1">
                        <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        <span className="text-slate-400 text-[10px] font-normal">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {r.comment || "No detailed review left."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Operating Hours & Trust Badges */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Working Hours</h3>
              
              <div className="space-y-2">
                {DAYS.map((dayName, idx) => {
                  const schedule = provider.working_hours.find((w) => w.day_of_week === idx);
                  const active = schedule ? schedule.is_active : false;

                  return (
                    <div
                      key={dayName}
                      className="flex items-center justify-between py-2 text-xs border-b border-slate-50 last:border-0"
                    >
                      <span className="font-bold text-slate-700">{dayName}</span>
                      {active ? (
                        <span className="font-medium text-slate-600">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold">Quetta Safe Service Guarantee</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                All confirmed bookings through QuettaServices are covered with direct verified provider records and dispute moderation.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}