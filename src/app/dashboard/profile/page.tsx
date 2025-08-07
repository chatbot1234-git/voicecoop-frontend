'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Key,
  Github,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
export default function ProfilePage() {
  const { data: session } = useSession();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || session?.user?.name || '',
    email: user?.email || session?.user?.email || '',
  });
  const handleSave = async () => {
    // TODO: Implémenter la sauvegarde du profil
    setIsEditing(false);
  };
  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || session?.user?.name || '',
      email: user?.email || session?.user?.email || '',
    });
    setIsEditing(false);
  };
  const profileData = {
    name: user?.full_name || session?.user?.name || 'Utilisateur',
    email: user?.email || session?.user?.email || '',
    avatar: session?.user?.image || null,
    provider: session?.provider || 'credentials',
    created_at: user?.created_at || new Date().toISOString(),
  };
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mon Profil
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Gérez vos informations personnelles et paramètres de sécurité
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profil */}
          <Card variant="elevated" className="dark:bg-dark-800 dark:border-dark-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </div>
                {/* Informations */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Nom complet"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                      <Input
                        label="Adresse email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Nom complet
                        </label>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {profileData.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Adresse email
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {profileData.email}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Sécurité */}
          <Card variant="elevated" className="dark:bg-dark-800 dark:border-dark-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mot de passe */}
                {profileData.provider === 'credentials' && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Mot de passe
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dernière modification il y a 30 jours
                        </p>
                      </div>
                    </div>
                    <Link href="/auth/change-password">
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </Link>
                  </div>
                )}
                {/* Connexion GitHub */}
                {profileData.provider === 'github' && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-5 w-5 text-gray-900 dark:text-white" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Connecté via GitHub
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Authentification sécurisée via GitHub
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Actif
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card variant="elevated" className="dark:bg-dark-800 dark:border-dark-600">
            <CardHeader>
              <CardTitle className="text-lg">Activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Conversations
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    24
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Votes participés
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    12
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Membre depuis
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(profileData.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Actions rapides */}
          <Card variant="elevated" className="dark:bg-dark-800 dark:border-dark-600">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/auth/change-password">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Exporter mes données
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer le compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}