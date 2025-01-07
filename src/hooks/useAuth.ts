import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { useToastContext } from '../context/ToastContext';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastContext();

  useEffect(() => {
    async function handleSession(user: User | null) {
      if (user) {
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
        } catch (error) {
          console.error('Error syncing profile:', error);
          showToast('Failed to sync profile', 'error');
        }
      }
      setUser(user);
      setLoading(false);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [showToast]);

  return { user, loading };
}