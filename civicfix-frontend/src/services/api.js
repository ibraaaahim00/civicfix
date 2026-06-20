import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      return Promise.reject(error);
    }
);

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const reportsApi = {
  list: (params) => api.get("/reports", { params }),
  create: (formData) =>
      api.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
  getById: (id) => api.get(`/reports/${id}`),
  update: (id, payload) => api.patch(`/reports/${id}`, payload),
  updateStatus: (id, payload) => api.patch(`/reports/${id}/status`, payload),
  assign: (id, payload) => api.patch(`/reports/${id}/assign`, payload),
  remove: (id) => api.delete(`/reports/${id}`),
};

export const statsApi = {
  overview: () => api.get("/stats/overview"),
};

export const usersApi = {
  list: (params) => api.get("/users", { params }),
  technicians: () => api.get("/users/technicians"),
  createTechnician: (payload) => api.post("/users/technicians", payload),
};

export default api;
