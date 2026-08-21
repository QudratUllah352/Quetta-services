import api from "./axios";

export const createReport = (data) => api.post("/reports", data);

export const getAllReports = (statusFilter) =>
  api.get("/admin/reports", { params: statusFilter ? { status_filter: statusFilter } : {} });

export const resolveReport = (id) => api.patch(`/admin/reports/${id}/resolve`);

export const dismissReport = (id) => api.patch(`/admin/reports/${id}/dismiss`);