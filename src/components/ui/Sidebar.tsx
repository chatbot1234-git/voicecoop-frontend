'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Vote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/authStore';
interface SidebarProps {
  className?: string;
}
const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: Home },
  { name: 'Conversation', href: '/dashboard/conversation', icon: MessageSquare },
  { name: 'Voice Studio', href: '/dashboard/voice', icon: Mic },
  { name: 'Gouvernance', href: '/dashboard/governance', icon: Vote },
  { name: 'Communauté', href: '/dashboard/community', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];
const secondaryNavigation = [
  { name: 'Profil', href: '/dashboard/profile', icon: User },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const handleLogout = () => {
    logout();
  };
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{
          x: isMobileOpen ? 0 : -280
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-surface-100/20 backdrop-blur-xl border-r border-surface-300/30',
          'lg:translate-x-0 lg:static lg:inset-0',
          'transition-transform duration-300 ease-in-out',
          'w-full max-w-sm lg:w-70',
          className
        )}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header Next-Gen */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-300/30 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-200/5 to-secondary-200/5" />
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center shadow-lg">
              <Mic className="h-6 w-6 text-surface-50" />
            </div>
            <div className="relative">
              <h1 className="text-xl font-display font-bold text-surface-800 bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                VoiceCoop
              </h1>
              <p className="text-sm text-surface-600">Dashboard</p>
            </div>
          </div>
          {/* User info */}
          {user && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  )} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto h-2 w-2 rounded-full bg-primary-600"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          {/* Secondary navigation */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  )} />
                  {item.name}
                </Link>
              );
            })}
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Déconnexion
            </button>
          </div>
        </div>
      </motion.aside>
      {/* Desktop sidebar overlay */}
      <div className="hidden lg:block w-70" style={{ width: '280px' }} />
    </>
  );
};
export default Sidebar;