// src/lib/api.js
import axios from "axios";

const base =
    (import.meta.env?.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
    baseURL: `${base}/api`,
    withCredentials: false, // set true only if you use cookies
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


export default api;
