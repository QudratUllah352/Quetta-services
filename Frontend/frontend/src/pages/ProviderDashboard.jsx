import React, { useEffect, useState } from "react";
import {
  getMyServices,
  createService,
  updateService,
  deactivateService,
  getCategories,
} from "../api/services";
import { getProviderBookings, updateBookingStatus } from "../api/bookings";
import { getErrorMessage } from "../api/errors";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200/80",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200/80",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/80",
};

const NEXT_ACTIONS = {
  pending: [
    {
      label: "Confirm Request",
      status: "confirmed",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
    },
    {
      label: "Decline",
      status: "cancelled",
      btnClass: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
    },
  ],
  confirmed: [
    {
      label: "Mark Completed",
      status: "completed",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
    },
    {
      label: "Cancel Job",
      status: "cancelled",
      btnClass: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    },
  ],
};

const QUETTA_LOCATIONS = [
  "Jinnah Town",
  "Quetta Cantt",
  "Samungli Road",
  "Brewery Road",
  "Nawan Killi",
  "Airport Road",
  "Shahbaz Town",
  "Satellite Town",
];

export default function ProviderDashboard() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "Jinnah Town",
    category_id: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [svcRes, bookRes, catRes] = await Promise.allSettled([
        getMyServices(),
        getProviderBookings(),
        getCategories(),
      ]);

      if (svcRes.status === "fulfilled") setServices(svcRes.value.data || []);
      if (bookRes.status === "fulfilled") setBookings(bookRes.value.data || []);
      if (catRes.status === "fulfilled") setCategories(catRes.value.data || []);
    } catch {
      setActionError("Could not load your provider dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      price: "",
      location: "Jinnah Town",
      category_id: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (s) => {
    setForm({
      title: s.title,
      description: s.description || "",
      price: s.price,
      location: s.location || "Jinnah Town",
      category_id: s.category_id || "",
    });
    setEditingId(s.id);
    setShowForm(true);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      location: form.location,
      category_id: Number(form.category_id),
    };

    try {
      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await createService(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setActionError(getErrorMessage ? getErrorMessage(err) : "Error saving service listing.");
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this listing?")) return;
    try {
      await deactivateService(id);
      load();
    } catch (err) {
      setActionError(getErrorMessage ? getErrorMessage(err) : "Failed to deactivate listing.");
    }
  };

  const handleBookingAction = async (id, status) => {
    setActionError("");
    setActionLoadingId(id);
    try {
      await updateBookingStatus(id, status);
      load();
    } catch (err) {
      setActionError(getErrorMessage ? getErrorMessage(err) : "Failed to update booking status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-36 bg-white rounded-3xl animate-pulse border border-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-2xl animate-pulse border border-slate-200" />
            <div className="h-28 bg-white rounded-2xl animate-pulse border border-slate-200" />
            <div className="h-28 bg-white rounded-2xl animate-pulse border border-slate-200" />
          </div>
          <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  const activeServicesCount = services.filter((s) => s.status === "active").length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Verified Provider Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Provider Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Manage your local services, accept client appointments, and oversee bookings across Quetta.
            </p>
          </div>

          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all duration-150 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{showForm ? "✕ Close Form" : "＋ New Service Listing"}</span>
          </button>
        </div>

        {/* Action Error Notification */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError("")}
              className="text-red-500 hover:text-red-700 text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Listings
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {activeServicesCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              🛠️
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending Requests
              </p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
                {pendingBookingsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              ⏳
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Bookings
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {bookings.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              📋
            </div>
          </div>
        </div>

        {/* Expandable Service Form */}
        {showForm && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 transition-all">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Service Listing" : "Create a New Service Listing"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide detailed information so customers in Quetta can discover your service.
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Service Title
                </label>
                <input
                  placeholder="e.g. Professional AC Repair & Gas Refill"
                  required
                  value={form.title}
                  onChange={update("title")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Describe your expertise, experience, and what is included in this service..."
                  value={form.description}
                  onChange={update("description")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    required
                    value={form.price}
                    onChange={update("price")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Location in Quetta
                  </label>
                  <select
                    value={form.location}
                    onChange={update("location")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {QUETTA_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={form.category_id}
                    onChange={update("category_id")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20"
                >
                  {editingId ? "Save Changes" : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section 1: My Listings */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Listings</h2>
              <p className="text-xs text-slate-500">
                You have {services.length} total registered service{services.length === 1 ? "" : "s"}.
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                + Add Another
              </button>
            )}
          </div>

          {services.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-3xl">📦</span>
              <p className="mt-2 text-sm font-semibold text-slate-700">No service listings found</p>
              <p className="text-xs text-slate-400 mt-0.5">Click "+ New Service Listing" to publish your first offering.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{s.title}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          s.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {s.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Price: </span>
                      <span className="font-extrabold text-emerald-600">
                        Rs. {Number(s.price).toLocaleString()}
                      </span>
                      {s.location && <span className="text-slate-400 ml-2">📍 {s.location}</span>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        Edit
                      </button>
                      {s.status === "active" && (
                        <button
                          onClick={() => handleDeactivate(s.id)}
                          className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Incoming Bookings */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Incoming Client Requests</h2>
            <p className="text-xs text-slate-500">
              Manage client appointments and change booking statuses as work progresses.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-3xl">📅</span>
              <p className="mt-2 text-sm font-semibold text-slate-700">No client bookings yet</p>
              <p className="text-xs text-slate-400 mt-0.5">When customers book your services, requests will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {b.service?.title || `Service Listing #${b.service_id}`}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${STATUS_STYLES[b.status] || "bg-slate-100 text-slate-600"}`}>
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      📅 Scheduled:{" "}
                      <span className="font-semibold text-slate-700">
                        {b.booking_date ? new Date(b.booking_date).toLocaleString() : "TBD"}
                      </span>
                      {b.customer?.name && (
                        <span className="ml-2">
                          👤 Customer: <strong className="text-slate-700">{b.customer.name}</strong>
                        </span>
                      )}
                    </p>

                    {b.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-lg">
                        <strong>Client Note:</strong> "{b.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions according to NEXT_ACTIONS config */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {(NEXT_ACTIONS[b.status] || []).map((action) => (
                      <button
                        key={action.status}
                        disabled={actionLoadingId === b.id}
                        onClick={() => handleBookingAction(b.id, action.status)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          action.btnClass || "bg-slate-900 text-white"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoadingId === b.id ? "Updating..." : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}