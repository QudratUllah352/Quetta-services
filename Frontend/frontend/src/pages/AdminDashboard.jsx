import { useEffect, useState } from "react";
import {
  getAllUsers,
  deactivateUser,
  activateUser,
  getAllServicesAdmin,
  adminDeactivateService,
  getAllBookingsAdmin,
  createCategory,
} from "../api/admin";
import { getCategories } from "../api/services";
import { getAllReports, resolveReport, dismissReport } from "../api/reports";
import { getErrorMessage } from "../api/errors";

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [u, s, b, c, rp] = await Promise.all([
        getAllUsers(),
        getAllServicesAdmin(),
        getAllBookingsAdmin(),
        getCategories(),
        getAllReports(),
      ]);
      setUsers(u.data);
      setServices(s.data);
      setBookings(b.data);
      setCategories(c.data);
      setReports(rp.data);
    } catch {
      setError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleUser = async (u) => {
    setError("");
    try {
      if (u.is_active) await deactivateUser(u.id);
      else await activateUser(u.id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deactivateSvc = async (id) => {
    setError("");
    try {
      await adminDeactivateService(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createCategory(newCategory);
      setNewCategory({ name: "", description: "" });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleResolve = async (id) => {
    setError("");
    try {
      await resolveReport(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDismiss = async (id) => {
    setError("");
    try {
      await dismissReport(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const pendingReportCount = reports.filter((r) => r.status === "pending").length;

  const tabs = [
    { key: "users", label: `Users (${users.length})` },
    { key: "services", label: `Services (${services.length})` },
    { key: "bookings", label: `Bookings (${bookings.length})` },
    { key: "categories", label: `Categories (${categories.length})` },
    { key: "reports", label: `Reports (${pendingReportCount})` },
  ];

  if (loading) return <p className="text-center mt-16 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-900">Admin Panel</h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? "border-b-2 border-gray-900 font-medium text-gray-900"
                : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="mt-4 space-y-2">
          {users.length === 0 && (
            <p className="text-sm text-gray-400">No users found.</p>
          )}
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="font-medium text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">
                  {u.email} · {u.role}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {u.is_active ? "active" : "deactivated"}
                </span>
                <button onClick={() => toggleUser(u)} className="text-sm text-gray-900 underline">
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "services" && (
        <div className="mt-4 space-y-2">
          {services.length === 0 && (
            <p className="text-sm text-gray-400">No services found.</p>
          )}
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="font-medium text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-500">Rs. {s.price} · {s.status}</p>
              </div>
              {s.status === "active" && (
                <button onClick={() => deactivateSvc(s.id)} className="text-sm text-red-600 underline">
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div className="mt-4 space-y-2">
          {bookings.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
              Booking #{b.id} — service #{b.service_id} — {b.status} —{" "}
              {new Date(b.booking_date).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {tab === "categories" && (
        <div className="mt-4">
          <form onSubmit={submitCategory} className="flex gap-2 mb-4">
            <input
              placeholder="New category name"
              required
              value={newCategory.name}
              onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm flex-1"
            />
            <input
              placeholder="Description (optional)"
              value={newCategory.description}
              onChange={(e) => setNewCategory((c) => ({ ...c, description: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm flex-1"
            />
            <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">
              Add
            </button>
          </form>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{c.name}</p>
                {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-4 space-y-2">
          {reports.length === 0 && (
            <p className="text-sm text-gray-400">No reports have been filed.</p>
          )}
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.target_type} #{r.target_id}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Reported by user #{r.reporter_id} on{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    r.status === "pending"
                      ? "bg-yellow-50 text-yellow-700"
                      : r.status === "resolved"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.status === "pending" && (
                <div className="mt-2 flex gap-3 text-sm">
                  <button
                    onClick={() => handleResolve(r.id)}
                    className="text-gray-900 underline"
                  >
                    Mark resolved
                  </button>
                  <button
                    onClick={() => handleDismiss(r.id)}
                    className="text-gray-500 underline"
                  >
                    Dismiss
                  </button>
                  {r.target_type === "service" && (
                    <button
                      onClick={() => deactivateSvc(r.target_id)}
                      className="text-red-600 underline"
                    >
                      Deactivate reported service
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}