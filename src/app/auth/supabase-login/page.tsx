'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Github, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSupabaseAuth } from '@/stores/supabaseAuthStore';
// Schéma de validation
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
type LoginForm = z.infer<typeof loginSchema>;
export default function SupabaseLoginPage() {
  const router = useRouter();
  const { signIn, signInWithProvider, loading, error, clearError, isAuthenticated } = useSupabaseAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn(data.email, data.password);
      // La redirection se fait automatiquement via useEffect
    } catch (err) {
      // L'erreur est gérée par le store
      console.log('Erreur connexion:', err);
    }
  };
  const handleGitHubLogin = async () => {
    try {
      await signInWithProvider('github');
    } catch (err) {
      console.log('Erreur connexion GitHub:', err);
    }
  };
  const handleGoogleLogin = async () => {
    try {
      await signInWithProvider('google');
    } catch (err) {
      console.log('Erreur connexion Google:', err);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-teal/20 flex items-center justify-center p-4">
      {/* Effets de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-neon-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-teal bg-clip-text text-transparent">
                Connexion Supabase
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Accédez à votre espace VoiceCoop
              </p>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Erreur */}
            <AnimatePresence>
              {showError && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Formulaire */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <Input
                {...register('email')}
                type="email"
                label="Adresse email"
                placeholder="votre@email.com"
                error={errors.email?.message}
                disabled={loading || isSubmitting}
                icon={<Mail className="h-5 w-5" />}
              />
              {/* Mot de passe */}
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Mot de passe"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={loading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                  disabled={loading || isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Bouton de connexion */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading || isSubmitting}
                disabled={loading || isSubmitting}
              >
                Se connecter
              </Button>
            </form>
            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-deep-blue text-gray-400">Ou continuer avec</span>
              </div>
            </div>
            {/* Connexions sociales */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={handleGitHubLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                <Github className="h-5 w-5" />
                GitHub
              </Button>
              <Button
                variant="secondary"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>
            {/* Lien inscription */}
            <div className="text-center">
              <p className="text-gray-400">
                Pas encore de compte ?{' '}
                <Link
                  href="/auth/supabase-register"
                  className="text-teal hover:text-teal/80 transition-colors font-medium"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
            {/* Retour à l'ancienne version */}
            <div className="text-center pt-4 border-t border-white/10">
              <Link
                href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                ← Retour à l'ancienne connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}