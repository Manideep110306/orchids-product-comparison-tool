import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const searchProducts = async (query, options = {}) => {
  const { signal } = options;
  const { data } = await apiClient.get(`/search?q=${encodeURIComponent(query)}`, { signal });
  return data;
};

export const getWishlist = async () => {
  const { data } = await apiClient.get('/wishlist');
  return data;
};

export const addToWishlist = async (item) => {
  const { data } = await apiClient.post('/wishlist', item);
  return data;
};

export const removeFromWishlist = async (id) => {
  const { data } = await apiClient.delete(`/wishlist/${id}`);
  return data;
};
