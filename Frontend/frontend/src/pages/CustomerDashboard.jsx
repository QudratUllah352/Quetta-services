import { useEffect, useState } from "react";
import { getMyBookings, updateBookingStatus } from "../api/bookings";
import { createReview, getServiceReviews } from "../api/reviews";
import { getErrorMessage } from "../api/errors";

const STATUS_STYLES = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [reviewFormFor, setReviewFormFor] = useState(null); // booking id
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
      setBookings(res.data);

      // For each completed booking's service, check whether this booking
      // already has a review (reviews are public per-service, so we can
      // match by booking_id without a dedicated "my reviews" endpoint).
      const completedServiceIds = [
        ...new Set(
          res.data.filter((b) => b.status === "completed").map((b) => b.service_id)
        ),
      ];
      const reviewLists = await Promise.all(
        completedServiceIds.map((sid) => getServiceReviews(sid))
      );
      const reviewedIds = new Set(
        reviewLists.flatMap((r) => r.data.map((rv) => rv.booking_id))
      );
      setReviewedBookingIds(reviewedIds);
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
    setActionError("");
    try {
      await updateBookingStatus(id, "cancelled");
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const submitReview = async (bookingId) => {
    setActionError("");
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
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-center mt-16 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-900">My Bookings</h1>

      {actionError && (
        <p className="mt-3 text-sm text-red-600">{actionError}</p>
      )}

      {bookings.length === 0 && (
        <p className="mt-4 text-gray-400 text-sm">
          You haven't booked anything yet.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Service #{b.service_id}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(b.booking_date).toLocaleString()}
                </p>
                {b.notes && (
                  <p className="text-sm text-gray-400 mt-1">"{b.notes}"</p>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[b.status]}`}
              >
                {b.status}
              </span>
            </div>

            <div className="mt-3 flex gap-3">
              {(b.status === "pending" || b.status === "confirmed") && (
                <button
                  onClick={() => cancelBooking(b.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancel booking
                </button>
              )}

              {b.status === "completed" && !reviewedBookingIds.has(b.id) && (
                <button
                  onClick={() => setReviewFormFor(b.id)}
                  className="text-sm text-gray-900 underline"
                >
                  Leave a review
                </button>
              )}

              {b.status === "completed" && reviewedBookingIds.has(b.id) && (
                <span className="text-sm text-gray-400">Reviewed</span>
              )}
            </div>

            {reviewFormFor === b.id && (
              <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)} ({n})
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="How was it? (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitReview(b.id)}
                    className="text-sm rounded-md bg-gray-900 text-white px-3 py-1.5"
                  >
                    Submit review
                  </button>
                  <button
                    onClick={() => setReviewFormFor(null)}
                    className="text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}