'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useSupabaseAuth } from '@/stores/supabaseAuthStore';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
interface SupabaseContextType {
  supabase: SupabaseClient<Database>;
}
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const { initialize } = useSupabaseAuth();
  useEffect(() => {
    // Initialiser l'authentification au montage
    initialize();
  }, [initialize]);
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}