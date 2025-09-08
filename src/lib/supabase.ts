import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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