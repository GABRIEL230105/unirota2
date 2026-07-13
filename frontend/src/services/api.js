import axios from "axios";

export const api = axios.create({
  baseURL: "", // relativo — o Vite (em dev) faz proxy pro backend, ver vite.config.js
});

// adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@Auth:token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});