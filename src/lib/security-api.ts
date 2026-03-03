// API utility functions for security endpoints

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to get auth token
const getAuthToken = () => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    const parsed = JSON.parse(authData);
    return parsed.session?.access_token || null;
  }
  return null;
};

// Helper function to make API calls
const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
};

// GATE LOG ENDPOINTS
export const securityApi = {
  // Create gate log (EXIT/ENTRY)
  createGateLog: async (outpassId: string, gateAction: 'EXIT' | 'ENTRY', notes?: string) => {
    return apiCall('/security/gate-logs', {
      method: 'POST',
      body: JSON.stringify({
        outpassId,
        gateAction,
        notes,
      }),
    });
  },

  // Get gate logs with pagination
  getGateLogs: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return apiCall(`/security/gate-logs?${params}`);
  },

  // Create security alert
  createAlert: async (
    alertType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    message: string,
    outpassId?: string,
    studentId?: string
  ) => {
    return apiCall('/security/alerts', {
      method: 'POST',
      body: JSON.stringify({
        alertType,
        severity,
        message,
        outpassId,
        studentId,
      }),
    });
  },

  // Get security alerts
  getAlerts: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return apiCall(`/security/alerts?${params}`);
  },

  // Resolve alert
  resolveAlert: async (alertId: string, notes?: string) => {
    return apiCall(`/security/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },

  // Get daily logs summary
  getDailyLogs: async (date?: string) => {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }
    return apiCall(`/security/daily-logs?${params}`);
  },

  // Get security reports
  getReports: async (startDate?: string, endDate?: string, reportType?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (reportType) params.append('reportType', reportType);
    return apiCall(`/security/reports?${params}`);
  },

  // Search staff
  searchStaff: async (query?: string, department?: string, page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (query) params.append('query', query);
    if (department) params.append('department', department);
    return apiCall(`/security/search-staff?${params}`);
  },
};

export default securityApi;
