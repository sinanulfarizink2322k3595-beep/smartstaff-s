import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywuvuzplwkfqfkdhplkx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dXZ1enBsd2tmcWZrZGhwbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk4OTMxNzgsImV4cCI6MTk5NjQ2OTE3OH0.EXAMPLE_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth functions
export const signUp = async (email: string, password: string, userData: Record<string, unknown>) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Store user data in users table
      const { error: dbError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          auth_id: authData.user.id,
          email,
          ...userData,
          created_at: new Date(),
        },
      ]);

      if (dbError) throw dbError;
    }

    return { data: authData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Log user login in database
      await supabase.from('user_logins').insert([
        {
          user_id: data.user.id,
          email: data.user.email,
          login_time: new Date(),
          ip_address: await getClientIP(),
        },
      ]);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// Get user records from Supabase
export const getUserRecord = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Update user record
export const updateUserRecord = async (userId: string, updates: Record<string, unknown>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get all user logins
export const getUserLogins = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_logins')
      .select('*')
      .eq('user_id', userId)
      .order('login_time', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
