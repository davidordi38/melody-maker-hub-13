import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { LocalSong } from './useSupabaseMusicPlayer';

export interface SupabasePlaylist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithSongs extends SupabasePlaylist {
  songs: LocalSong[];
}

export const useSupabasePlaylists = () => {
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load playlists from Supabase
  const loadPlaylists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load songs for each playlist
      const playlistsWithSongs = await Promise.all(
        (data || []).map(async (playlist) => {
          const songs = await getPlaylistSongs(playlist.id);
          return { ...playlist, songs };
        })
      );

      setPlaylists(playlistsWithSongs);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (user) {
      loadPlaylists();
    }

    const playlistsChannel = supabase
      .channel('playlists-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playlists'
      }, () => {
        loadPlaylists();
      })
      .subscribe();

    const playlistSongsChannel = supabase
      .channel('playlist-songs-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playlist_songs'
      }, () => {
        loadPlaylists();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playlistsChannel);
      supabase.removeChannel(playlistSongsChannel);
    };
  }, [user, loadPlaylists]);

  // Create playlist
  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour créer une playlist",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Playlist créée avec succès",
      });

    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la playlist",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Delete playlist
  const deletePlaylist = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const playlist = playlists.find(p => p.id === id);
      if (!playlist) return;

      if (playlist.created_by !== user.id) {
        toast({
          title: "Non autorisé",
          description: "Vous ne pouvez supprimer que vos propres playlists",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Playlist supprimée avec succès",
      });

    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la playlist",
        variant: "destructive",
      });
    }
  }, [user, playlists, toast]);

  // Add song to playlist
  const addSongToPlaylist = useCallback(async (songId: string, playlistId: string) => {
    if (!user) return;

    try {
      // Get current max position
      const { data: existingSongs, error: queryError } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      if (queryError) throw queryError;

      const maxPosition = existingSongs && existingSongs.length > 0 ? existingSongs[0].position : -1;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position: maxPosition + 1,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Information",
            description: "Cette musique est déjà dans la playlist",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Succès",
        description: "Musique ajoutée à la playlist",
      });

    } catch (error) {
      console.error('Error adding song to playlist:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la musique à la playlist",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Remove song from playlist
  const removeSongFromPlaylist = useCallback(async (songId: string, playlistId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Musique retirée de la playlist",
      });

    } catch (error) {
      console.error('Error removing song from playlist:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer la musique de la playlist",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Get playlist songs
  const getPlaylistSongs = useCallback(async (playlistId: string): Promise<LocalSong[]> => {
    try {
      const { data, error } = await supabase
        .from('playlist_songs')
        .select(`
          song_id,
          position,
          songs:songs (*)
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;

      const songs = await Promise.all(
        (data || []).map(async (item: any) => {
          const song = item.songs;
          if (!song) return null;

          let url = song.file_url;
          if (!url && song.file_path) {
            const { data: urlData } = supabase.storage
              .from('music-files')
              .getPublicUrl(song.file_path);
            url = urlData.publicUrl;
          }

          return { ...song, url: url || '' };
        })
      );

      return songs.filter(Boolean);
    } catch (error) {
      console.error('Error getting playlist songs:', error);
      return [];
    }
  }, []);

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPlaylistSongs,
  };
};