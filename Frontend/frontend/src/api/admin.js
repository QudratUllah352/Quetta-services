import api from "./axios";

export const getAllUsers = () => api.get("/admin/users");
export const deactivateUser = (id) => api.patch(`/admin/users/${id}/deactivate`);
export const activateUser = (id) => api.patch(`/admin/users/${id}/activate`);

export const getAllServicesAdmin = () => api.get("/admin/services");
export const adminDeactivateService = (id) =>
  api.patch(`/admin/services/${id}/deactivate`);

export const getAllBookingsAdmin = () => api.get("/admin/bookings");

export const createCategory = (data) => api.post("/admin/categories", data);