import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// Schéma de validation pour l'inscription
const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validation des données
    const validatedData = registerSchema.parse(body);
    const { name, email, password } = validatedData;
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }
    // Hacher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        full_name: name,
        email,
        password_hash: hashedPassword,
        email_verified: true, // Pour simplifier, on considère l'email vérifié
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        created_at: true,
      }
    });
    console.log('✅ Utilisateur créé avec succès:', { id: user.id, email: user.email });
    return NextResponse.json(
      {
        message: 'Inscription réussie',
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
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
    // Erreur Prisma (contrainte unique, etc.)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}