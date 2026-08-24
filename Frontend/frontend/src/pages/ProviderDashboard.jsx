import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New Service Form State
  const [showForm, setShowForm] = useState(false);
  const [serviceData, setServiceData] = useState({
    title: "",
    description: "",
    price: "",
    location: "Jinnah Town",
    category: "Electrician",
  });

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, servicesRes] = await Promise.allSettled([
        axios.get("/provider/bookings"),
        axios.get("/services"),
      ]);

      if (bookingsRes.status === "fulfilled") {
        setIncomingBookings(bookingsRes.value.data || []);
      }
      if (servicesRes.status === "fulfilled") {
        // Filter listings created by this provider
        const allServices = servicesRes.value.data || [];
        setMyServices(
          allServices.filter((s) => s.provider_id === user?.id || s.user_id === user?.id)
        );
      }
    } catch (err) {
      console.error("Failed to load provider data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      setActionLoading(true);
      await axios.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchProviderData();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/services", serviceData);
      setShowForm(false);
      setServiceData({
        title: "",
        description: "",
        price: "",
        location: "Jinnah Town",
        category: "Electrician",
      });
      fetchProviderData();
    } catch (err) {
      console.error("Failed to add service:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Provider Portal Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-100">
              Provider Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {user?.name || user?.full_name || "Provider"} Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage client requests, update job statuses, and add new services in Quetta.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            {showForm ? "Close Form" : "+ Create New Service"}
          </button>
        </div>

        {/* Create Service Modal/Card */}
        {showForm && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add a New Service Listing</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Service Title (e.g. UPS & Solar Installation)"
                  value={serviceData.title}
                  onChange={(e) => setServiceData({ ...serviceData, title: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="number"
                  required
                  placeholder="Price (PKR)"
                  value={serviceData.price}
                  onChange={(e) => setServiceData({ ...serviceData, price: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <textarea
                required
                rows={3}
                placeholder="Detailed description of your service..."
                value={serviceData.description}
                onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700"
              >
                Publish Service
              </button>
            </form>
          </div>
        )}

        {/* Incoming Client Bookings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Incoming Client Bookings</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : incomingBookings.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No client bookings received yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {incomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {b.service?.title || `Service Request #${b.service_id}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Customer: {b.customer_name || b.customer_email || "Customer"} | Date: {b.booking_date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === "pending" && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => updateBookingStatus(b.id, "confirmed")}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => updateBookingStatus(b.id, "cancelled")}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => updateBookingStatus(b.id, "completed")}
                        className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all"
                      >
                        Mark Completed
                      </button>
                    )}
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold capitalize">
                      {b.status}
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