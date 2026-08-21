import { useEffect, useState } from "react";
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
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

// What actions are valid from each booking status, mirroring the backend's
// ALLOWED_TRANSITIONS map in app/routers/bookings.py.
const NEXT_ACTIONS = {
  pending: [
    { label: "Confirm", status: "confirmed" },
    { label: "Decline", status: "cancelled" },
  ],
  confirmed: [
    { label: "Mark completed", status: "completed" },
    { label: "Cancel", status: "cancelled" },
  ],
};

export default function ProviderDashboard() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    category_id: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [svcRes, bookRes, catRes] = await Promise.all([
        getMyServices(),
        getProviderBookings(),
        getCategories(),
      ]);
      setServices(svcRes.data);
      setBookings(bookRes.data);
      setCategories(catRes.data);
    } catch {
      setActionError("Could not load your dashboard.");
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
    setForm({ title: "", description: "", price: "", location: "", category_id: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (s) => {
    setForm({
      title: s.title,
      description: s.description || "",
      price: s.price,
      location: s.location || "",
      category_id: s.category_id,
    });
    setEditingId(s.id);
    setShowForm(true);
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
      setActionError(getErrorMessage(err));
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateService(id);
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleBookingAction = async (id, status) => {
    setActionError("");
    try {
      await updateBookingStatus(id, status);
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-center mt-16 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-900">Provider Dashboard</h1>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      {/* Services */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">My Listings</h2>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="text-sm rounded-md bg-gray-900 text-white px-3 py-1.5"
          >
            {showForm ? "Cancel" : "+ New Listing"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
            <input
              placeholder="Title"
              required
              value={form.title}
              onChange={update("title")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={update("description")}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Price (Rs.)"
                required
                value={form.price}
                onChange={update("price")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={update("location")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <select
              required
              value={form.category_id}
              onChange={update("category_id")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium"
            >
              {editingId ? "Save changes" : "Create listing"}
            </button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {services.length === 0 && (
            <p className="text-sm text-gray-400">You have no listings yet.</p>
          )}
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="font-medium text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-500">
                  Rs. {s.price} ·{" "}
                  <span className={s.status === "active" ? "text-green-600" : "text-gray-400"}>
                    {s.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(s)} className="text-gray-600 underline">
                  Edit
                </button>
                {s.status === "active" && (
                  <button
                    onClick={() => handleDeactivate(s.id)}
                    className="text-red-600 underline"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Incoming bookings */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-gray-900">Bookings</h2>
        {bookings.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">No bookings yet.</p>
        )}
        <div className="mt-4 space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">
                    Service #{b.service_id} — {new Date(b.booking_date).toLocaleString()}
                  </p>
                  {b.notes && <p className="text-sm text-gray-400">"{b.notes}"</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>
                  {b.status}
                </span>
              </div>
              <div className="mt-2 flex gap-3">
                {(NEXT_ACTIONS[b.status] || []).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleBookingAction(b.id, action.status)}
                    className="text-sm text-gray-900 underline"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}