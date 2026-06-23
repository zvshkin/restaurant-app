import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId, isAnonymous = false) => {
    if (isAnonymous) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Ошибка загрузки профиля:', error.message);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id, session.user.is_anonymous);
        setProfile(prof);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id, session.user.is_anonymous);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInAsGuest = async () => {
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (existingSession?.user?.is_anonymous) {
      return { session: existingSession, user: existingSession.user };
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  };

  const refreshProfile = useCallback(async () => {
    if (!user || user.is_anonymous) return null;
    const prof = await fetchProfile(user.id, false);
    setProfile(prof);
    return prof;
  }, [user, fetchProfile]);

  const isGuest    = user?.is_anonymous === true;
  const isDirector = profile?.role === 'director';
  const isAdmin    = profile?.role === 'admin';
  const isChef     = profile?.role === 'chef';
  const isClient   = profile?.role === 'client';
  const role       = isGuest ? 'guest' : (profile?.role ?? null);

  const value = {
    user,
    profile,
    loading,
    isGuest,
    isDirector,
    isAdmin,
    isChef,
    isClient,
    role,
    signIn,
    signUp,
    signOut,
    signInAsGuest,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}