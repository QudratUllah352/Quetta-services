import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("verifications"); // verifications | users | services | reports | categories
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Data States
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [reports, setReports] = useState([]);

  // Modal State for Rejecting Verification
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Category Creation State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  useEffect(() => {
    if (!token || user?.role?.toLowerCase() !== "admin") {
      navigate("/login");
      return;
    }
    loadData();
  }, [token, user]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [verRes, usrRes, svcRes, repRes] = await Promise.allSettled([
        axios.get("/admin/verifications"),
        axios.get("/admin/users"),
        axios.get("/admin/services"),
        axios.get("/admin/reports"),
      ]);

      if (verRes.status === "fulfilled") setVerifications(verRes.value.data || []);
      if (usrRes.status === "fulfilled") setUsers(usrRes.value.data || []);
      if (svcRes.status === "fulfilled") setServices(svcRes.value.data || []);
      if (repRes.status === "fulfilled") setReports(repRes.value.data || []);
    } catch {
      setErrorMessage("Failed to load admin panel data.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage("");
    } else {
      setSuccessMessage(msg);
      setErrorMessage("");
    }
    setTimeout(() => {
      setErrorMessage("");
      setSuccessMessage("");
    }, 4000);
  };

  // --- Provider Verification Actions ---
  const handleApproveProvider = async (providerId) => {
    setActionLoadingId(providerId);
    try {
      await axios.patch(`/admin/verifications/${providerId}`, {
        status: "verified",
      });
      showNotification("Provider successfully verified!");
      loadData();
    } catch {
      showNotification("Could not approve provider.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (providerId) => {
    setSelectedProviderId(providerId);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedProviderId) return;
    setActionLoadingId(selectedProviderId);
    try {
      await axios.patch(`/admin/verifications/${selectedProviderId}`, {
        status: "rejected",
        rejection_reason: rejectionReason || "Uploaded documents did not meet verification criteria.",
      });
      setRejectModalOpen(false);
      showNotification("Provider verification rejected.");
      loadData();
    } catch {
      showNotification("Could not reject verification.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- User Moderation Actions ---
  const handleToggleUserStatus = async (targetUser) => {
    setActionLoadingId(targetUser.id);
    try {
      const endpoint = targetUser.is_active
        ? `/admin/users/${targetUser.id}/deactivate`
        : `/admin/users/${targetUser.id}/activate`;
      await axios.patch(endpoint);
      showNotification(
        `User account ${targetUser.is_active ? "deactivated" : "activated"} successfully.`
      );
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Action failed.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Service Moderation Actions ---
  const handleDeactivateService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to deactivate this service listing?")) return;
    setActionLoadingId(serviceId);
    try {
      await axios.patch(`/admin/services/${serviceId}/deactivate`);
      showNotification("Service listing deactivated.");
      loadData();
    } catch {
      showNotification("Could not deactivate service.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Report Actions ---
  const handleResolveReport = async (reportId, action) => {
    setActionLoadingId(reportId);
    try {
      await axios.patch(`/admin/reports/${reportId}/${action}`);
      showNotification(`Report marked as ${action}.`);
      loadData();
    } catch {
      showNotification(`Failed to ${action} report.`, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Category Creation ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await axios.post("/admin/categories", {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      setNewCatName("");
      setNewCatDesc("");
      showNotification("Category created successfully!");
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to create category.", true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-32 bg-white rounded-3xl animate-pulse border border-slate-200" />
          <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="bg-linear-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-purple-400/30">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Admin Moderation Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              QuettaServices Control Panel
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Approve verified service providers, manage active user accounts, review reports, and oversee platform catalog.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
          >
            <span>🔄 Refresh Data</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="underline">Dismiss</button>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="underline">Dismiss</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("verifications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "verifications"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🛡️ Verifications</span>
            {verifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                {verifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            👥 All Users ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "services"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            🛠️ Services ({services.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "reports"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🚩 Reports</span>
            {reports.filter((r) => r.status === "pending").length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {reports.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            🏷️ Categories
          </button>
        </div>

        {/* TAB 1: Provider Verifications */}
        {activeTab === "verifications" && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Pending Provider Applications</h2>
              <p className="text-xs text-slate-500">
                Review submitted National ID numbers and credential documentation before approving verification badges.
              </p>
            </div>

            {verifications.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                <span className="text-3xl">🎉</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending provider verifications in the queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {verifications.map((p) => (
                  <div key={p.id} className="py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          Pending Review
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                        <p><strong>Email:</strong> {p.email}</p>
                        <p><strong>Phone:</strong> {p.phone || "N/A"}</p>
                        <p><strong>Location:</strong> {p.location || "Quetta"}</p>
                        <p><strong>CNIC Number:</strong> <span className="font-mono font-bold text-slate-800">{p.cnic_number || "Not provided"}</span></p>
                      </div>

                      {p.document_url && (
                        <div className="pt-2">
                          <a
                            href={p.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                          >
                            <span>📄 View Submitted Document Attachment</span> →
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleOpenRejectModal(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveProvider(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                      >
                        {actionLoadingId === p.id ? "Approving..." : "✓ Approve & Verify"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Users Management */}
        {activeTab === "users" && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">User Moderation</h2>
              <p className="text-xs text-slate-500">Manage customer, provider, and administrator platform accounts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Verification</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="p-3 uppercase font-bold text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full ${
                          u.role === "admin" ? "bg-purple-100 text-purple-800" :
                          u.role === "provider" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 capitalize">
                        {u.verification_status || "N/A"}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${u.is_active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        {u.is_active ? "Active" : "Deactivated"}
                      </td>
                      <td className="p-3 text-right">
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={actionLoadingId === u.id}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              u.is_active
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: Services Moderation */}
        {activeTab === "services" && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Service Catalog Moderation</h2>
              <p className="text-xs text-slate-500">Deactivate reported or improper marketplace listings.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {services.map((s) => (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {s.location || "Quetta"} • Rs. {Number(s.price).toLocaleString()} • Status: <strong className="uppercase">{s.status}</strong>
                    </p>
                  </div>

                  {s.status === "active" && (
                    <button
                      onClick={() => handleDeactivateService(s.id)}
                      disabled={actionLoadingId === s.id}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                    >
                      Deactivate Listing
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 4: Reports Queue */}
        {activeTab === "reports" && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Content Moderation & Reports</h2>
              <p className="text-xs text-slate-500">Customer feedback on fraud, improper listings, or provider conduct.</p>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                <span className="text-3xl">🛡️</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">No user reports filed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <div key={r.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {r.target_type} #{r.target_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === "pending" ? "bg-amber-100 text-amber-800" :
                          r.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">"{r.reason}"</p>
                    </div>

                    {r.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveReport(r.id, "dismiss")}
                          disabled={actionLoadingId === r.id}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleResolveReport(r.id, "resolve")}
                          disabled={actionLoadingId === r.id}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: Categories Management */}
        {activeTab === "categories" && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Service Category</h2>
              <p className="text-xs text-slate-500">Expand the types of services available on the marketplace.</p>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar Panel Technicians"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of this service domain..."
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Create Category
              </button>
            </form>
          </section>
        )}

        {/* Rejection Reason Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Decline Provider Verification
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Please provide a clear reason so the provider can re-submit valid documentation.
              </p>

              <textarea
                placeholder="e.g. CNIC photo was blurry or expired. Please upload a clear photo of your original CNIC."
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === selectedProviderId}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}