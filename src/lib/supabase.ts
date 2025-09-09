import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// For development/demo purposes - will work when Supabase is properly connected
const isDevelopment = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => !isDevelopment;

export type Profile = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Song = {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  file_path: string;
  file_url?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PlaylistSong = {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
};

export type CollectionSong = {
  id: string;
  collection_id: string;
  song_id: string;
  added_at: string;
};