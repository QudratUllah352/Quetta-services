import api from "./axios";

export const createReview = (data) => api.post("/reviews", data);

export const getServiceReviews = (serviceId) =>
  api.get(`/reviews/service/${serviceId}`);