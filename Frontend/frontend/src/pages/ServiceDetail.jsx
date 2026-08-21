import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getService } from "../api/services";
import { getServiceReviews } from "../api/reviews";
import { createBooking } from "../api/bookings";
import { createReport } from "../api/reports";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingDate, setBookingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null); // "success" | "error" | null
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reportTarget, setReportTarget] = useState(null); // { type, id } | null
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState(null); // "success" | "error" | null
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getService(id), getServiceReviews(id)])
      .then(([svcRes, reviewsRes]) => {
        setService(svcRes.data);
        setReviews(reviewsRes.data);
      })
      .catch(() => setError("Could not load this service."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError("");
    setSubmitting(true);
    try {
      await createBooking({
        service_id: Number(id),
        booking_date: new Date(bookingDate).toISOString(),
        notes,
      });
      setBookingStatus("success");
    } catch (err) {
      setBookingStatus("error");
      setBookingError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setReportError("");
    try {
      await createReport({
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason,
      });
      setReportStatus("success");
      setReportReason("");
    } catch (err) {
      setReportError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-center mt-16 text-gray-400">Loading...</p>;
  if (error) return <p className="text-center mt-16 text-red-600">{error}</p>;
  if (!service) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-900">{service.title}</h1>
      <p className="mt-1 text-gray-500">by {service.provider_name}</p>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span className="text-lg font-semibold text-gray-900">
          Rs. {service.price}
        </span>
        {service.location && <span>{service.location}</span>}
        <span>
          {service.average_rating
            ? `★ ${service.average_rating} (${service.review_count} reviews)`
            : "No reviews yet"}
        </span>
      </div>

      <p className="mt-6 text-gray-700 whitespace-pre-line">
        {service.description}
      </p>

      {user && (
        <button
          onClick={() => {
            setReportTarget({ type: "service", id: service.id });
            setReportStatus(null);
            setReportError("");
          }}
          className="mt-2 text-xs text-gray-400 underline hover:text-gray-600"
        >
          Report this service
        </button>
      )}

      {reportTarget && (
        <div className="mt-3 rounded-md border border-gray-200 p-3">
          {reportStatus === "success" ? (
            <p className="text-sm text-green-700">
              Thanks — this has been reported to our admin team for review.
            </p>
          ) : (
            <form onSubmit={submitReport} className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Report this {reportTarget.type}
              </p>
              <textarea
                required
                minLength={5}
                placeholder="What's wrong with it?"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {reportError && <p className="text-sm text-red-600">{reportError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="text-sm rounded-md bg-gray-900 text-white px-3 py-1.5"
                >
                  Submit report
                </button>
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Booking form - customers only */}
      {user?.role === "customer" && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900">Book this service</h2>

          {bookingStatus === "success" ? (
            <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              Booking request sent! The provider will confirm it shortly. Check
              "My Bookings" to track its status.
            </p>
          ) : (
            <form onSubmit={handleBook} className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date &amp; time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              {bookingError && (
                <p className="text-sm text-red-600">{bookingError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-gray-900 py-2 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Request Booking"}
              </button>
            </form>
          )}
        </div>
      )}

      {!user && (
        <p className="mt-8 text-sm text-gray-500 border-t border-gray-200 pt-6">
          Log in as a customer to book this service.
        </p>
      )}

      {/* Reviews */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900">Reviews</h2>
        {reviews.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">No reviews yet.</p>
        )}
        <div className="mt-3 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-3">
              <div className="text-sm font-medium text-gray-900">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>
              {r.comment && (
                <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
              )}
              {user && (
                <button
                  onClick={() => {
                    setReportTarget({ type: "review", id: r.id });
                    setReportStatus(null);
                    setReportError("");
                  }}
                  className="mt-1 text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Report this review
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}