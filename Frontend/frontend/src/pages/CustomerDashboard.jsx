import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, updateBookingStatus } from "../api/bookings";
import { createReview, getServiceReviews } from "../api/reviews";
import { getErrorMessage } from "../api/errors";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200/80",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200/80",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/80",
};

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Review Form States
  const [reviewFormFor, setReviewFormFor] = useState(null); // booking id
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
      const bookingData = res.data || [];
      setBookings(bookingData);

      // Check which completed bookings have already been reviewed
      const completedServiceIds = [
        ...new Set(
          bookingData
            .filter((b) => b.status === "completed")
            .map((b) => b.service_id)
        ),
      ];

      if (completedServiceIds.length > 0) {
        const reviewLists = await Promise.all(
          completedServiceIds.map((sid) => getServiceReviews(sid))
        );
        const reviewedIds = new Set(
          reviewLists.flatMap((r) => (r.data || []).map((rv) => rv.booking_id))
        );
        setReviewedBookingIds(reviewedIds);
      }
    } catch {
      setActionError("Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setActionError("");
    setActionLoadingId(id);
    try {
      await updateBookingStatus(id, "cancelled");
      load();
    } catch (err) {
      setActionError(getErrorMessage ? getErrorMessage(err) : "Failed to cancel booking.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitReview = async (bookingId) => {
    setActionError("");
    setSubmittingReview(true);
    try {
      await createReview({
        booking_id: bookingId,
        rating: Number(reviewRating),
        comment: reviewComment,
      });
      setReviewFormFor(null);
      setReviewComment("");
      setReviewRating(5);
      load();
    } catch (err) {
      setActionError(getErrorMessage ? getErrorMessage(err) : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-32 bg-white rounded-3xl animate-pulse border border-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />
          </div>
          <div className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  const activeBookingsCount = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  ).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Customer Header Banner */}
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-400/30">
              Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Bookings & History
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track active service appointments in Quetta, cancel pending requests, and leave reviews for completed work.
            </p>
          </div>

          <Link
            to="/"
            className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 text-sm font-bold shadow-lg transition-all duration-150 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <span>+ Book New Service</span>
          </Link>
        </div>

        {/* Error Notification */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Bookings
              </p>
              <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                {activeBookingsCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              ⏳
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {completedCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              ✅
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Orders
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {bookings.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg">
              📋
            </div>
          </div>
        </div>

        {/* Bookings List Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Booking Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of your requested service providers across Quetta.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {bookings.length} record{bookings.length === 1 ? "" : "s"}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <span className="text-4xl">📅</span>
              <h3 className="mt-3 text-base font-semibold text-slate-800">
                You haven't booked anything yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Explore local electricians, plumbers, and tutors to place your first booking.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
              >
                Find Services in Quetta →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const isReviewed = reviewedBookingIds.has(b.id);

                return (
                  <div key={b.id} className="py-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Booking Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {b.service?.title || `Service Order #${b.service_id}`}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              STATUS_STYLES[b.status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                          <span>
                            📅 Scheduled:{" "}
                            <strong className="text-slate-700">
                              {b.booking_date ? new Date(b.booking_date).toLocaleString() : "TBD"}
                            </strong>
                          </span>
                          {b.service?.price && (
                            <span>
                              💰 Price:{" "}
                              <strong className="text-emerald-600">
                                Rs. {Number(b.service.price).toLocaleString()}
                              </strong>
                            </span>
                          )}
                          <span>📍 Quetta</span>
                        </div>

                        {b.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-xl">
                            <strong>My Note:</strong> "{b.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action Area */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button
                            disabled={actionLoadingId === b.id}
                            onClick={() => cancelBooking(b.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === b.id ? "Cancelling..." : "Cancel Booking"}
                          </button>
                        )}

                        {b.status === "completed" && !isReviewed && (
                          <button
                            onClick={() =>
                              setReviewFormFor(reviewFormFor === b.id ? null : b.id)
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition-colors"
                          >
                            {reviewFormFor === b.id ? "Close Review" : "⭐ Leave a Review"}
                          </button>
                        )}

                        {b.status === "completed" && isReviewed && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                            <span>✓</span> Reviewed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline Review Form */}
                    {reviewFormFor === b.id && (
                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Review Your Experience
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Rate the quality and punctuality of this service provider.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Rating
                          </label>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="5">★★★★★ (5 - Excellent)</option>
                            <option value="4">★★★★☆ (4 - Good)</option>
                            <option value="3">★★★☆☆ (3 - Average)</option>
                            <option value="2">★★☆☆☆ (2 - Below Average)</option>
                            <option value="1">★☆☆☆☆ (1 - Poor)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Comment (Optional)
                          </label>
                          <textarea
                            placeholder="Share details about your experience..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => submitReview(b.id)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewFormFor(null)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}