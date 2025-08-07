#!/bin/bash

# =====================================================
# SCRIPT D'INSTALLATION SUPABASE LOCAL POUR VOICECOOP
# =====================================================

echo "🚀 Installation de Supabase Local pour VoiceCoop..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
fi

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible."
    exit 1
fi

echo "✅ Docker détecté"

# Installation de Supabase CLI
echo "📦 Installation de Supabase CLI..."

# Détecter l'OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "🪟 Détection Windows - Installation via npm..."
    npm install -g supabase
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Détection macOS - Installation via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        echo "⚠️ Homebrew non détecté, installation via npm..."
        npm install -g supabase
    fi
else
    # Linux
    echo "🐧 Détection Linux - Installation via npm..."
    npm install -g supabase
fi

# Vérifier l'installation
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI installé avec succès"
    supabase --version
else
    echo "❌ Échec de l'installation de Supabase CLI"
    exit 1
fi

echo "🎉 Installation terminée !"
echo ""
echo "🔄 Prochaines étapes :"
echo "1. cd frontend-nextgen"
echo "2. supabase init"
echo "3. supabase start"
echo "4. Exécuter les scripts SQL"
