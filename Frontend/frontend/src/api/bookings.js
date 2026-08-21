import api from "./axios";

export const createBooking = (data) => api.post("/bookings", data);

export const getMyBookings = () => api.get("/bookings/my");

export const getProviderBookings = () => api.get("/bookings/provider");

export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });