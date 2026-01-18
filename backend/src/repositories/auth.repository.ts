import { supabase } from '../config/supabase.js';

export class AuthRepository {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  }

  async getUser(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data;
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return data;
  }
}

