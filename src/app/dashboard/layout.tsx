'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/ui/Sidebar';
import { useAuth } from '@/stores/authStore';
interface DashboardLayoutProps {
  children: React.ReactNode;
}
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, user, checkTokenExpiry } = useAuth();
  const router = useRouter();
  useEffect(() => {
    // Vérifier l'authentification
    if (!isAuthenticated || !checkTokenExpiry()) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, router, checkTokenExpiry]);
  // Afficher un loader pendant la vérification
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 flex relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar Next-Gen */}
        <header className="bg-surface-100/20 backdrop-blur-md border-b border-surface-300/30 px-6 py-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-200/5 to-secondary-200/5" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-surface-800 bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-surface-600 mt-1">
                Bienvenue sur votre plateforme IA vocale coopérative
              </p>
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>
        {/* Page content */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}