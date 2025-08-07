'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { validators } from '@/lib/utils';
// Schéma de validation
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });
  const newPassword = watch('newPassword');
  // Vérifier la force du mot de passe
  React.useEffect(() => {
    if (newPassword) {
      setPasswordStrength(validators.password(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);
  // Rediriger si non connecté
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simuler une vérification du mot de passe actuel
        if (data.currentPassword !== 'password123') {
          throw new Error('Mot de passe actuel incorrect');
        }
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/profile');
        }, 2000);
        return;
      }
      // Mode production - vraie API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erreur lors du changement de mot de passe');
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/profile');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au profil
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <Lock className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Changer le mot de passe
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Mettez à jour votre mot de passe pour sécuriser votre compte
          </p>
        </motion.div>
        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" padding="lg" className="dark:bg-dark-800 dark:border-dark-600">
            <CardContent>
              {/* Message de succès */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      Mot de passe modifié avec succès !
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      Redirection vers votre profil...
                    </p>
                  </div>
                </motion.div>
              )}
              {/* Erreur */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </motion.div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Mot de passe actuel */}
                <Input
                  {...register('currentPassword')}
                  type="password"
                  label="Mot de passe actuel"
                  placeholder="Votre mot de passe actuel"
                  leftIcon={<Lock />}
                  error={errors.currentPassword?.message}
                  disabled={isSubmitting || success}
                />
                {/* Nouveau mot de passe */}
                <div>
                  <Input
                    {...register('newPassword')}
                    type="password"
                    label="Nouveau mot de passe"
                    placeholder="Créez un nouveau mot de passe"
                    leftIcon={<Lock />}
                    error={errors.newPassword?.message}
                    disabled={isSubmitting || success}
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
                                ? 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-700'
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
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600" />
                            )}
                            <span className={passwordStrength.checks[key] ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Confirmation nouveau mot de passe */}
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  label="Confirmer le nouveau mot de passe"
                  placeholder="Répétez votre nouveau mot de passe"
                  leftIcon={<Lock />}
                  error={errors.confirmPassword?.message}
                  disabled={isSubmitting || success}
                />
                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isSubmitting}
                  disabled={isSubmitting || success}
                >
                  {success ? 'Mot de passe modifié !' : 'Changer le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        {/* Conseils de sécurité */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Conseils de sécurité
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Utilisez un mot de passe unique pour VoiceCoop</li>
            <li>• Combinez lettres, chiffres et caractères spéciaux</li>
            <li>• Évitez les informations personnelles évidentes</li>
            <li>• Changez votre mot de passe régulièrement</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}