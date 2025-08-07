'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { Mail, Lock, Mic, ArrowLeft, AlertCircle, Github } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
// Schéma de validation
const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;
export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, clearError, setError } = useAuth();
  const [showError, setShowError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginForm) => {
    try {
      clearError();
      console.log('🔑 Tentative de connexion avec:', data.email);
      // Utiliser NextAuth pour la connexion avec credentials
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      console.log('🔍 Résultat NextAuth:', result);
      if (result?.error) {
        console.log('❌ Erreur NextAuth:', result.error);
        throw new Error('Email ou mot de passe incorrect');
      }
      if (result?.ok) {
        console.log('✅ Connexion NextAuth réussie');
        // Mettre à jour le store d'authentification
        try {
          const { getSession } = await import('next-auth/react');
          const session = await getSession();
          if (session?.user) {
            console.log('✅ Session récupérée:', session.user);
            // Synchroniser avec le store Zustand
            const { setUser, setToken } = useAuth.getState();
            setUser({
              id: parseInt(session.user.id || '1'),
              email: session.user.email || data.email,
              full_name: session.user.name || 'Utilisateur',
              is_active: true,
              created_at: new Date().toISOString(),
            });
            setToken('nextauth-session');
            useAuth.setState({ isAuthenticated: true });
          }
        } catch (sessionError) {
          console.log('⚠️ Erreur récupération session:', sessionError);
        }
        // Redirection vers dashboard
        console.log('🔄 Redirection vers dashboard...');
        router.push('/dashboard');
      } else {
        throw new Error('Erreur de connexion inconnue');
      }
    } catch (err) {
      console.log('❌ Erreur connexion:', err);
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(message);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };
  // Connexion avec GitHub
  const handleGitHubLogin = async () => {
    try {
      await signIn('github', { callbackUrl: '/dashboard' });
    } catch (error) {
      setError('Erreur lors de la connexion avec GitHub');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects Next-Gen */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2BA297 0%, #274755 100%)' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #EAC873 0%, #F5A86B 100%)' }}
          animate={{
            scale: [1.2, 0.8, 1.2],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      <div className="relative w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <Mic className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Connexion à VoiceCoop
          </h1>
          <p className="text-gray-600 mt-2">
            Accédez à votre plateforme IA vocale coopérative
          </p>
        </motion.div>
        {/* Formulaire de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" padding="lg">
            <CardContent>
              {/* Erreur globale */}
              {error && showError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                  <p className="text-error text-sm">{error}</p>
                </motion.div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <Input
                  {...register('email')}
                  type="email"
                  label="Adresse email"
                  placeholder="votre@email.com"
                  leftIcon={<Mail />}
                  error={errors.email?.message}
                  disabled={loading}
                />
                {/* Mot de passe */}
                <Input
                  {...register('password')}
                  type="password"
                  label="Mot de passe"
                  placeholder="Votre mot de passe"
                  leftIcon={<Lock />}
                  error={errors.password?.message}
                  disabled={loading}
                />
                {/* Options */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-600">Se souvenir de moi</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading || isSubmitting}
                  disabled={loading || isSubmitting}
                >
                  Se connecter
                </Button>
              </form>
              {/* Séparateur */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-4 text-sm text-gray-500">ou</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              {/* Connexion sociale */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center justify-center gap-3 hover:bg-gray-900 hover:text-white transition-colors"
                  onClick={handleGitHubLogin}
                  disabled={loading || isSubmitting}
                >
                  <Github className="h-5 w-5" />
                  Continuer avec GitHub
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled
                >
                  Continuer avec Google
                </Button>
              </div>
              {/* Lien inscription */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link
                    href="/auth/register"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/legal/terms" className="text-primary-600 hover:underline">
              Conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/legal/privacy" className="text-primary-600 hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}