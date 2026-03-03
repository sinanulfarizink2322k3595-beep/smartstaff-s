// Mock authentication for development/testing without backend
// This provides hardcoded test accounts

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "STUDENT" | "SECURITY";
  organizationId: string;
  organizationCode: string;
  createdAt: string;
}

interface MockLoginResponse {
  token: string;
  user: MockUser;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

// Test accounts
const MOCK_ACCOUNTS: Record<string, { password: string; user: MockUser }> = {
  "admin@example.com": {
    password: "admin123",
    user: {
      id: "user-admin-001",
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
      organizationId: "org-001",
      organizationCode: "ORG001",
      createdAt: new Date().toISOString(),
    },
  },
  "staff@example.com": {
    password: "staff123",
    user: {
      id: "user-staff-001",
      email: "staff@example.com",
      name: "Staff Member",
      role: "STAFF",
      organizationId: "org-001",
      organizationCode: "ORG001",
      createdAt: new Date().toISOString(),
    },
  },
  "student@example.com": {
    password: "student123",
    user: {
      id: "user-student-001",
      email: "student@example.com",
      name: "Student User",
      role: "STUDENT",
      organizationId: "org-001",
      organizationCode: "ORG001",
      createdAt: new Date().toISOString(),
    },
  },
  "security@example.com": {
    password: "security123",
    user: {
      id: "user-security-001",
      email: "security@example.com",
      name: "Security Staff",
      role: "SECURITY",
      organizationId: "org-001",
      organizationCode: "ORG001",
      createdAt: new Date().toISOString(),
    },
  },
};

export const mockAuthApi = {
  login: async (email: string, password: string): Promise<MockLoginResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const account = MOCK_ACCOUNTS[email.toLowerCase()];

    if (!account) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Account not found",
            error: "Invalid email or password",
          },
        },
      };
    }

    if (account.password !== password) {
      throw {
        response: {
          status: 401,
          data: {
            message: "Invalid password",
            error: "Invalid email or password",
          },
        },
      };
    }

    return {
      token: `mock-token-${Date.now()}`,
      user: account.user,
      organization: {
        id: "org-001",
        name: "SmartStaff Nilgiri",
        slug: "ORG001",
      },
    };
  },

  signup: async (data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
  }): Promise<MockLoginResponse> => {
    // For demo purposes, allow signup with any email
    const email = data.email.toLowerCase();

    if (MOCK_ACCOUNTS[email]) {
      throw {
        response: {
          status: 400,
          data: {
            message: "Account already exists",
            error: "This email is already registered",
          },
        },
      };
    }

    // Create new user
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email,
      name: data.fullName,
      role: data.role as "ADMIN" | "STAFF" | "STUDENT" | "SECURITY",
      organizationId: "org-001",
      organizationCode: "ORG001",
      createdAt: new Date().toISOString(),
    };

    return {
      token: `mock-token-${Date.now()}`,
      user: newUser,
      organization: {
        id: "org-001",
        name: "SmartStaff Nilgiri",
        slug: "ORG001",
      },
    };
  },

  verify: async (token: string): Promise<MockUser> => {
    // For now, just return a mock user
    return MOCK_ACCOUNTS["student@example.com"].user;
  },
};

export default mockAuthApi;
