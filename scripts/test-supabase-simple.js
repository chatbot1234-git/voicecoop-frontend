#!/usr/bin/env node

/**
 * Test simple de connexion Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni433kdQwgnWNReilDMblYTn_I0';

console.log('🔗 Test de connexion Supabase Local...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Vérifier les tables
console.log('\n📋 Test des tables...');
try {
  const { data: tables, error } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ Erreur table user_profiles:', error.message);
  } else {
    console.log('✅ Table user_profiles accessible');
  }
} catch (err) {
  console.log('❌ Erreur connexion:', err.message);
}

// Test 2: Vérifier l'authentification
console.log('\n🔐 Test d\'authentification...');
try {
  const { data, error } = await supabase.auth.getSession();
  console.log('✅ Service auth accessible');
  console.log('Session:', data.session ? 'Connecté' : 'Non connecté');
} catch (err) {
  console.log('❌ Erreur auth:', err.message);
}

// Test 3: Test d'inscription
console.log('\n👤 Test d\'inscription...');
try {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  if (error) {
    console.log('⚠️ Erreur inscription (normal si utilisateur existe):', error.message);
  } else {
    console.log('✅ Inscription réussie:', data.user?.email);
  }
} catch (err) {
  console.log('❌ Erreur inscription:', err.message);
}

console.log('\n✅ Tests terminés');
