const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnsiymjsjmoaelqjbwca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc2l5bWpzam1vYWVscWpid2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDQ3NTIsImV4cCI6MjA5NDY4MDc1Mn0.EiTQ4tJaItMhvKA0ZE_FeHyX8OCfkwjNZBm3_18g1j8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'iqbal@gmail.com',
    password: 'iqbal123',
  });

  if (error) {
    console.error('Login gagal:', error.message);
    return;
  }

  console.log('Login customer berhasil');
  console.log('User ID:', data.user.id);
  console.log('\nAccess Token:\n');
  console.log(data.session.access_token);
}

login();