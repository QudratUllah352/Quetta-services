import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const fetchCustomerBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/bookings/me");
      setBookings(res.data || []);
    } catch (err) {
      console.error("Failed to load customer bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Customer Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-100">
              Customer Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {user?.name || user?.full_name || "Customer"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your local service requests and booking statuses in Quetta.
            </p>
          </div>
          <Link
            to="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            + Browse New Services
          </Link>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Your Bookings</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl">
              <span className="text-4xl">📅</span>
              <h3 className="mt-3 text-base font-semibold text-slate-800">No active bookings yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Explore local electricians, plumbers, and tutors to place your first booking.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                Find Services in Quetta →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {booking.service?.title || `Service #${booking.service_id}`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>📅 Date: {booking.booking_date || "Scheduled"}</span>
                      <span>📍 Quetta</span>
                      {booking.notes && <span>📝 Notes: {booking.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}