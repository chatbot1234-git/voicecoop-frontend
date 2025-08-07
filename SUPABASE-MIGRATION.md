# 🚀 Migration vers Supabase - Plan Détaillé

## 🎯 Objectifs de la Migration

### Remplacer :
- ❌ SQLite (dev seulement)
- ❌ NextAuth complexe
- ❌ APIs CRUD manuelles
- ❌ WebSocket custom

### Par :
- ✅ PostgreSQL Supabase (production-ready)
- ✅ Auth Supabase intégrée
- ✅ API auto-générée
- ✅ Real-time intégré

## 📋 Phase 1 : Setup Supabase (30 min)

### 1.1 Création du Projet Supabase
```bash
# 1. Aller sur https://supabase.com
# 2. Créer un nouveau projet "voicecoop"
# 3. Récupérer les clés API
```

### 1.2 Installation des Dépendances
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 1.3 Configuration Environnement
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 📋 Phase 2 : Migration du Schéma (45 min)

### 2.1 Schéma Utilisateurs
```sql
-- Supabase gère automatiquement auth.users
-- Table publique pour données étendues
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2.2 Schéma Conversations
```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON messages
  FOR ALL USING (auth.uid() = user_id);
```

### 2.3 Schéma Gouvernance
```sql
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected')),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- RLS pour gouvernance
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view proposals" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create proposals" ON proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can vote" ON votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

## 📋 Phase 3 : Migration de l'Auth (60 min)

### 3.1 Configuration Supabase Client
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3.2 Remplacement NextAuth
```typescript
// Avant (NextAuth)
const { data: session } = useSession()

// Après (Supabase)
const { data: { user } } = await supabase.auth.getUser()
```

### 3.3 Pages Auth Simplifiées
```typescript
// auth/login/page.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function Login() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['github', 'google']}
      redirectTo={`${window.location.origin}/dashboard`}
    />
  )
}
```

## 📋 Phase 4 : Migration des APIs (90 min)

### 4.1 Remplacement CRUD
```typescript
// Avant (API routes manuelles)
// /api/conversations/route.ts - 100+ lignes

// Après (Supabase direct)
const { data: conversations } = await supabase
  .from('conversations')
  .select('*')
  .eq('user_id', user.id)
```

### 4.2 Real-time Conversations
```typescript
// Real-time messages
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [conversationId])
```

### 4.3 Stockage Audio
```typescript
// Upload audio avec Supabase Storage
const uploadAudio = async (audioBlob: Blob) => {
  const fileName = `audio-${Date.now()}.wav`
  
  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(fileName, audioBlob)
  
  if (error) throw error
  
  // URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

## 📋 Phase 5 : Gouvernance Real-time (45 min)

### 5.1 Votes en Temps Réel
```typescript
// Votes temps réel
const { data: votes } = await supabase
  .from('votes')
  .select(`
    *,
    proposals (
      title,
      votes_for,
      votes_against
    )
  `)
  .eq('user_id', user.id)

// Subscription aux nouveaux votes
supabase
  .channel('votes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'votes'
  }, (payload) => {
    // Mise à jour temps réel des résultats
  })
  .subscribe()
```

## 🎯 Avantages Immédiats Post-Migration

### 🔐 Authentification
- ✅ Auth UI prête à l'emploi
- ✅ OAuth (GitHub, Google, etc.)
- ✅ Magic links
- ✅ Sécurité RLS automatique

### ⚡ Performance
- ✅ PostgreSQL optimisé
- ✅ CDN global
- ✅ Caching automatique
- ✅ Scaling automatique

### 🛠️ Développement
- ✅ API auto-générée
- ✅ TypeScript types automatiques
- ✅ Dashboard admin
- ✅ Logs et monitoring

### 🚀 Production
- ✅ Backup automatique
- ✅ Point-in-time recovery
- ✅ Monitoring intégré
- ✅ Alertes automatiques

## 📊 Comparaison Effort vs Bénéfices

### Effort Migration : ~4-5 heures
- Phase 1 : 30 min (setup)
- Phase 2 : 45 min (schéma)
- Phase 3 : 60 min (auth)
- Phase 4 : 90 min (APIs)
- Phase 5 : 45 min (gouvernance)

### Bénéfices : Énormes
- 🔥 **-70% de code auth** (suppression NextAuth)
- 🔥 **-80% de code API** (auto-générée)
- 🔥 **+100% real-time** (WebSocket automatique)
- 🔥 **+200% fonctionnalités** (RLS, storage, etc.)

## 🚀 Recommandation Finale

**MIGRATION FORTEMENT RECOMMANDÉE** pour :

1. **Simplification drastique** du code
2. **Fonctionnalités avancées** (real-time, RLS)
3. **Production-ready** immédiat
4. **Scaling automatique**
5. **Maintenance réduite**

**ROI : Excellent** - 5h d'effort pour des mois de développement économisés.

## 🎯 Prochaines Étapes

1. **Créer compte Supabase** (5 min)
2. **Lancer Phase 1** (setup)
3. **Migration progressive** (par feature)
4. **Tests et validation**
5. **Déploiement production**
