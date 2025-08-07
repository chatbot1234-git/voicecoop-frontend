'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
// Schéma de validation
const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Simuler l'envoi d'email
        setSuccess(true);
        return;
      }
      // Mode production - vraie API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erreur lors de l\'envoi de l\'email');
      }
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
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
            href="/auth/login"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <Mail className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Mot de passe oublié
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
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
                  className="text-center"
                >
                  <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                      Email envoyé !
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                      Un lien de réinitialisation a été envoyé à :
                    </p>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {getValues('email')}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link href="/auth/login">
                        <Button variant="primary" size="sm" className="w-full">
                          Retour à la connexion
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSuccess(false);
                          setError(null);
                        }}
                        className="w-full"
                      >
                        Renvoyer l'email
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Formulaire */}
              {!success && (
                <>
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
                    {/* Email */}
                    <Input
                      {...register('email')}
                      type="email"
                      label="Adresse email"
                      placeholder="votre@email.com"
                      leftIcon={<Mail />}
                      error={errors.email?.message}
                      disabled={isSubmitting}
                    />
                    {/* Bouton d'envoi */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le lien de réinitialisation
                    </Button>
                  </form>
                  {/* Lien retour */}
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Vous vous souvenez de votre mot de passe ?{' '}
                      <Link
                        href="/auth/login"
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Se connecter
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* Informations supplémentaires */}
        {!success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Que se passe-t-il ensuite ?
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Vous recevrez un email avec un lien sécurisé</li>
              <li>• Le lien est valide pendant 1 heure</li>
              <li>• Cliquez sur le lien pour créer un nouveau mot de passe</li>
              <li>• Vérifiez aussi vos spams si vous ne voyez rien</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}