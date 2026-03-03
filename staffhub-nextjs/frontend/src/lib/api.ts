import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { organizationName: string; organizationSlug: string; fullName: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  signup: (data: {
    organizationCode: string;
    email: string;
    password: string;
    fullName: string;
    role: string;
    department?: string;
    rollNumber?: string;
    phone?: string;
  }) => api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
  verifyToken: () => api.get("/auth/verify"),
};

// User API
export const userApi = {
  getAll: (params?: any) => api.get("/users", { params }),
  getOrganizationUsers: (params?: any) => api.get("/users/organization", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Organization API
export const organizationApi = {
  get: () => api.get("/organizations"),
  update: (data: any) => api.put("/organizations", data),
};

// Outpass API
export const outpassApi = {
  create: (data: any) => api.post("/outpass", data),
  getAll: (params?: any) => api.get("/outpass", { params }),
  getById: (id: string) => api.get(`/outpass/${id}`),
  updateStatus: (id: string, data: { status: string; remarks?: string; rejectionReason?: string }) =>
    api.patch(`/outpass/${id}/status`, data),
  updateGateStatus: (id: string, data: { gateStatus: string }) =>
    api.patch(`/outpass/${id}/gate`, data),
};

// Meeting API
export const meetingApi = {
  create: (data: any) => api.post("/meetings", data),
  getAll: (params?: any) => api.get("/meetings", { params }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  updateStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.put(`/meetings/${id}/status`, data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
};

// Staff API
export const staffApi = {
  getAll: () => api.get("/staff"),
  getById: (id: string) => api.get(`/staff/${id}`),
  getAvailability: (id: string) => api.get(`/staff/${id}/availability`),
  updateAvailability: (id: string, data: any) => api.put(`/staff/${id}/availability`, data),
  getMyAvailability: () => api.get("/staff/me/availability"),
  updateMyAvailability: (data: any) => api.put("/staff/me/availability", data),
};

// Feedback API
export const feedbackApi = {
  create: (data: any) => api.post("/feedback", data),
  getAll: () => api.get("/feedback"),
  updateStatus: (id: string, data: { status: string; response?: string }) =>
    api.put(`/feedback/${id}`, data),
};

// Organization Builder API
export const orgBuilderApi = {
  generate: (prompt: string) => api.post("/orgbuilder/generate", { prompt }),
  apply: (structure: any) => api.post("/orgbuilder/apply", { structure }),
  undo: () => api.post("/orgbuilder/undo"),
  getStructure: () => api.get("/orgbuilder/structure"),
  deleteDepartment: (id: string) => api.delete(`/orgbuilder/departments/${id}`),
  deleteRole: (id: string) => api.delete(`/orgbuilder/roles/${id}`),
  clear: () => api.delete("/orgbuilder/clear"),
};

export default api;
