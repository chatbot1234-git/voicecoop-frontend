import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// Schéma de validation pour la connexion
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validation des données
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    console.log('🔍 Tentative de connexion pour:', email);
    // Rechercher l'utilisateur dans la base de données
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        full_name: true,
        email: true,
        password_hash: true,
        email_verified: true,
        created_at: true,
      }
    });
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    console.log('✅ Connexion réussie pour:', email);
    // Retourner les informations utilisateur (sans le mot de passe)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: null,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}