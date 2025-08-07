# =====================================================
# SCRIPT POWERSHELL D'INSTALLATION SUPABASE LOCAL
# =====================================================

Write-Host "🚀 Installation de Supabase Local pour VoiceCoop..." -ForegroundColor Green

# Vérifier Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé. Veuillez installer Docker Desktop." -ForegroundColor Red
    exit 1
}

# Vérifier Node.js et npm
try {
    npm --version | Out-Null
    Write-Host "✅ npm détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé. Veuillez installer Node.js." -ForegroundColor Red
    exit 1
}

# Installation de Supabase CLI
Write-Host "📦 Installation de Supabase CLI via npm..." -ForegroundColor Yellow
try {
    npm install -g supabase
    Write-Host "✅ Supabase CLI installé avec succès" -ForegroundColor Green
    
    # Vérifier l'installation
    supabase --version
} catch {
    Write-Host "❌ Échec de l'installation de Supabase CLI" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Installation terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. cd frontend-nextgen" -ForegroundColor White
Write-Host "2. supabase init" -ForegroundColor White
Write-Host "3. supabase start" -ForegroundColor White
Write-Host "4. Exécuter les scripts SQL" -ForegroundColor White
