import api from "./axios";

export const getServices = (params) => api.get("/services", { params });

export const getCategories = () => api.get("/services/categories");

export const getService = (id) => api.get(`/services/${id}`);

export const getMyServices = () => api.get("/services/mine");

export const createService = (data) => api.post("/services", data);

export const updateService = (id, data) => api.put(`/services/${id}`, data);

export const deactivateService = (id) =>
  api.patch(`/services/${id}/deactivate`);