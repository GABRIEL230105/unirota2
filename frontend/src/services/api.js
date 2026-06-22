import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
});

// adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@Auth:token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});