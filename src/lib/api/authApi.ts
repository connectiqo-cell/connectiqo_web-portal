import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

function generateUsername(email: string) {
  const prefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 15);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${suffix}`;
}

export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  role: "mentor" | "learner" | "both";
};

/** Ported from connectfront/src/api/authApi.js — same Supabase project, same auth flow. */
export const authApi = {
  signUp: async ({ email, password, name, role }: SignUpParams) => {
    const supabase = createClient();
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      const userId = authData.user!.id;
      const username = generateUsername(email);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            email,
            name,
            role,
            username,
            created_at: new Date().toISOString(),
          },
        ])
        
        .select()
        .single();

      if (profileError) throw profileError;

      return {
        user: authData.user,
        profile: profileData,
        message: "Account created! Check your email to verify.",
      };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  signIn: async ({ email, password }: { email: string; password: string }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  sendPasswordResetOtp: async (email: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updatePassword: async (newPassword: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  signOut: async () => {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getProfile: async (userId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Calls the delete-account Edge Function (service-role deletion of auth + profile data). */
  deleteAccount: async () => {
    const supabase = createClient();
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
