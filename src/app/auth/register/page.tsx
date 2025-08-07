'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Mic, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { validators } from '@/lib/utils';
// Schéma de validation
const registerSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof registerSchema>;
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [showError, setShowError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const password = watch('password');
  // Vérifier la force du mot de passe
  React.useEffect(() => {
    if (password) {
      setPasswordStrength(validators.password(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);
  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError();
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });
      router.push('/dashboard');
    } catch (err) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-secondary-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-100 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-green opacity-20 blur-3xl" />
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
            Rejoindre VoiceCoop
          </h1>
          <p className="text-gray-600 mt-2">
            Créez votre compte et rejoignez la révolution IA vocale
          </p>
        </motion.div>
        {/* Formulaire d'inscription */}
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
                {/* Nom complet */}
                <Input
                  {...register('full_name')}
                  type="text"
                  label="Nom complet"
                  placeholder="Jean Dupont"
                  leftIcon={<User />}
                  error={errors.full_name?.message}
                  disabled={loading}
                />
                {/* Email */}
                <Input
                  {...register('email')}
                  type="email"
                  label="Adresse email"
                  placeholder="jean@exemple.com"
                  leftIcon={<Mail />}
                  error={errors.email?.message}
                  disabled={loading}
                />
                {/* Mot de passe */}
                <div>
                  <Input
                    {...register('password')}
                    type="password"
                    label="Mot de passe"
                    placeholder="Créez un mot de passe sécurisé"
                    leftIcon={<Lock />}
                    error={errors.password?.message}
                    disabled={loading}
                  />
                  {/* Indicateur de force du mot de passe */}
                  {passwordStrength && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              Object.values(passwordStrength.checks).filter(Boolean).length >= level
                                ? 'bg-accent-green'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs space-y-1">
                        {[
                          { key: 'minLength', label: 'Au moins 8 caractères' },
                          { key: 'hasUpper', label: 'Une majuscule' },
                          { key: 'hasLower', label: 'Une minuscule' },
                          { key: 'hasNumber', label: 'Un chiffre' },
                          { key: 'hasSpecial', label: 'Un caractère spécial' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            {passwordStrength.checks[key] ? (
                              <CheckCircle className="h-3 w-3 text-accent-green" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-gray-300" />
                            )}
                            <span className={passwordStrength.checks[key] ? 'text-accent-green' : 'text-gray-500'}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Confirmation mot de passe */}
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  label="Confirmer le mot de passe"
                  placeholder="Répétez votre mot de passe"
                  leftIcon={<Lock />}
                  error={errors.confirmPassword?.message}
                  disabled={loading}
                />
                {/* Acceptation des conditions */}
                <div>
                  <label className="flex items-start gap-3">
                    <input
                      {...register('acceptTerms')}
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-600">
                      J'accepte les{' '}
                      <Link href="/legal/terms" className="text-primary-600 hover:underline">
                        Conditions d'utilisation
                      </Link>{' '}
                      et la{' '}
                      <Link href="/legal/privacy" className="text-primary-600 hover:underline">
                        Politique de confidentialité
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm text-error">{errors.acceptTerms.message}</p>
                  )}
                </div>
                {/* Bouton d'inscription */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading || isSubmitting}
                  disabled={loading || isSubmitting}
                >
                  Créer mon compte
                </Button>
              </form>
              {/* Lien connexion */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Déjà un compte ?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}