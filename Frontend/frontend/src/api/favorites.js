import axios from "./axios";

export const getMyFavorites = () => axios.get("/favorites");
export const getMyFavoriteIds = () => axios.get("/favorites/ids");
export const toggleFavorite = (serviceId) => axios.post(`/favorites/toggle/${serviceId}`);