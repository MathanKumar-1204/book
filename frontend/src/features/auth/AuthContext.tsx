import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { api } from '../../services/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface RegisterResult {
  emailConfirmationRequired: boolean;
  email: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerAuthor: (fullName: string, email: string, pass: string) => Promise<RegisterResult>;
  resendVerificationEmail: (email: string) => Promise<void>;
  loginAsDemo: (demoType: 'admin' | 'author_priya' | 'author_rohit' | 'author_sneha') => Promise<void>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  role: null,
  isLoading: false,
  loginWithEmail: async () => {},
  registerAuthor: async () => ({ emailConfirmationRequired: false, email: '' }),
  resendVerificationEmail: async () => {},
  loginAsDemo: async () => {},
  logout: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const token = api.getToken();
        if (token) {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } else if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data.session && data.session.user?.email_confirmed_at) {
            api.setToken(data.session.access_token);
            const profile = await api.getCurrentUser();
            setUser(profile);
          }
        }
      } catch (err) {
        console.warn('[Auth] Session check:', err);
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user?.email_confirmed_at) {
          api.setToken(session.access_token);
          try {
            const profile = await api.getCurrentUser();
            setUser(profile);
          } catch (e) {
            console.error('Failed to fetch user profile:', e);
          }
        } else if (event === 'SIGNED_OUT') {
          api.setToken(null);
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error('Your email has not been verified yet. Please check your inbox and click the verification link before logging in.');
          }
          throw error;
        }

        // Verify email confirmed status
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut().catch(() => {});
          throw new Error('Your email has not been verified yet. Please check your inbox and click the verification link before logging in.');
        }

        if (data.session) {
          api.setToken(data.session.access_token);
          const profile = await api.getCurrentUser();
          setUser(profile);
          return;
        }
      }

      // Backend API login
      const res = await api.login(email, pass);
      api.setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const registerAuthor = async (fullName: string, email: string, pass: string): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'author',
            },
          },
        });

        if (error) throw error;

        // If email confirmation is required, session will be null and email_confirmed_at is null
        const isConfirmed = Boolean(data.session || data.user?.email_confirmed_at);
        if (!isConfirmed) {
          // Do not log in immediately. Instruct user to verify their email.
          return { emailConfirmationRequired: true, email: email.trim() };
        }

        if (data.session) {
          api.setToken(data.session.access_token);
          const profile = await api.getCurrentUser();
          setUser(profile);
          return { emailConfirmationRequired: false, email: email.trim() };
        }
      }

      // Backend API registration fallback
      const res = await api.register(fullName, email, pass);
      api.setToken(res.token);
      setUser(res.user);
      return { emailConfirmationRequired: false, email: email.trim() };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
    }
  };

  const loginAsDemo = async (demoType: 'admin' | 'author_priya' | 'author_rohit' | 'author_sneha') => {
    setIsLoading(true);
    try {
      let token = 'demo-admin';
      if (demoType === 'author_priya') {
        token = 'demo-author-00000000-0000-0000-0000-000000000002'; // Priya Sharma
      } else if (demoType === 'author_rohit') {
        token = 'demo-author-00000000-0000-0000-0000-000000000003'; // Rohit Kapoor
      } else if (demoType === 'author_sneha') {
        token = 'demo-author-00000000-0000-0000-0000-000000000008'; // Sneha Kulkarni
      }

      api.setToken(token);
      const profile = await api.getCurrentUser();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        loginWithEmail,
        registerAuthor,
        resendVerificationEmail,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context ?? defaultAuthContext;
};
