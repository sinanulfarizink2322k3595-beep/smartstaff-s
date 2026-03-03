export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "STUDENT" | "SECURITY";
  organizationId: string;
  organizationCode?: string;
  createdAt: string;
}

import { signIn as supabaseSignIn, signOut as supabaseSignOut, getUserRecord } from './supabase';

const isBrowser = () => typeof window !== "undefined";

export const setToken = (token: string) => {
  if (!isBrowser()) return;
  localStorage.setItem("token", token);
};

export const getToken = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem("token");
};

export const removeToken = () => {
  if (!isBrowser()) return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const setUser = (user: Partial<User> & { fullName?: string; organizationSlug?: string }) => {
  if (!isBrowser()) return;
  const normalizedUser: User = {
    id: user.id || "",
    email: user.email || "",
    name: user.name || user.fullName || "",
    role: (user.role as User["role"]) || "STUDENT",
    organizationId: user.organizationId || "org-1",
    organizationCode: user.organizationCode || user.organizationSlug,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  localStorage.setItem("user", JSON.stringify(normalizedUser));
};

export const getUser = (): User | null => {
  if (!isBrowser()) return null;
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Supabase auth login
export const loginWithSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await supabaseSignIn(email, password);
    if (error) throw error;

    if (data?.user) {
      const { data: userRecord } = await getUserRecord(data.user.id);
      if (userRecord) {
        setUser({
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.full_name,
          role: userRecord.role?.toUpperCase() as User["role"],
          organizationId: "org-1",
          organizationCode: userRecord.organization_code,
        });
      }
      return { user: data.user, error: null };
    }

    return { user: null, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const logoutWithSupabase = async () => {
  const { error } = await supabaseSignOut();
  removeToken();
  return { error };
};

export const hasRole = (role: User["role"]): boolean => {
  const user = getUser();
  return user?.role === role;
};

export const hasAnyRole = (roles: User["role"][]): boolean => {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
};
