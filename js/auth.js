import { supabase } from './supabase-client.js';

export let currentUser = null;
let _onChange = null;

export async function initAuth(onAuthChange) {
  _onChange = onAuthChange;
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  onAuthChange(currentUser);
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    if (_onChange) _onChange(currentUser);
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://jmitsuominor-ux.github.io/peptide-reference/',
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
