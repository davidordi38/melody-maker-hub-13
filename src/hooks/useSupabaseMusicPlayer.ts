import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LocalSong {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  file_path?: string;
  url: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MusicPlayerState {
  currentSong: LocalSong | null;
  isPlaying: boolean;
  currentTime: number;
  queue: LocalSong[];
  currentIndex: number;
}

export const useSupabaseMusicPlayer = () => {
  const [songs, setSongs] = useState<LocalSong[]>([]);
  const [playerState, setPlayerState] = useState<MusicPlayerState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    queue: [],
    currentIndex: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load songs from Supabase
  const loadSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const songsWithUrls = await Promise.all(
        (data || []).map(async (song) => {
          if (song.file_url) {
            return { ...song, url: song.file_url };
          }
          
          if (song.file_path) {
            const { data: urlData } = supabase.storage
              .from('music-files')
              .getPublicUrl(song.file_path);
            
            return { ...song, url: urlData.publicUrl };
          }

          return { ...song, url: '' };
        })
      );

      setSongs(songsWithUrls);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les musiques",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    loadSongs();

    const channel = supabase
      .channel('songs-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'songs'
      }, () => {
        loadSongs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSongs]);

  // Upload songs to Supabase
  const addSongs = useCallback(async (files: FileList): Promise<LocalSong[]> => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour uploader des musiques",
        variant: "destructive",
      });
      return [];
    }

    setIsUploading(true);
    const uploadedSongs: LocalSong[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.mp3')) {
          toast({
            title: "Format non supporté",
            description: `${file.name} n'est pas un fichier MP3`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = 'mp3';
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('music-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('music-files')
          .getPublicUrl(fileName);

        // Extract metadata
        const duration = await getAudioDuration(file);
        const { title, artist } = await getAudioMetadata(file);

        // Insert song record
        const { data: insertData, error: insertError } = await supabase
          .from('songs')
          .insert({
            title: title || file.name.replace('.mp3', ''),
            artist,
            duration,
            file_path: fileName,
            file_url: urlData.publicUrl,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (insertData) {
          uploadedSongs.push({
            ...insertData,
            url: urlData.publicUrl,
          });
        }
      }

      toast({
        title: "Succès",
        description: `${uploadedSongs.length} musique(s) uploadée(s) avec succès`,
      });

      return uploadedSongs;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader les musiques",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  // Helper functions
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const getAudioMetadata = (file: File): Promise<{ title?: string; artist?: string }> => {
    return new Promise((resolve) => {
      const fileName = file.name.replace('.mp3', '');
      const parts = fileName.split(' - ');
      
      if (parts.length >= 2) {
        resolve({
          artist: parts[0].trim(),
          title: parts[1].trim(),
        });
      } else {
        resolve({
          title: fileName,
        });
      }
    });
  };

  // Playback controls
  const playSong = useCallback((song: LocalSong, queue?: LocalSong[]) => {
    const newQueue = queue || songs;
    const index = newQueue.findIndex(s => s.id === song.id);
    
    setPlayerState({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      currentIndex: index,
    });
  }, [songs]);

  const togglePlayPause = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  const playNext = useCallback(() => {
    setPlayerState(prev => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex < prev.queue.length) {
        return {
          ...prev,
          currentSong: prev.queue[nextIndex],
          currentIndex: nextIndex,
          currentTime: 0,
        };
      }
      return prev;
    });
  }, []);

  const playPrevious = useCallback(() => {
    setPlayerState(prev => {
      const prevIndex = prev.currentIndex - 1;
      if (prevIndex >= 0) {
        return {
          ...prev,
          currentSong: prev.queue[prevIndex],
          currentIndex: prevIndex,
          currentTime: 0,
        };
      }
      return prev;
    });
  }, []);

  const playAllSongs = useCallback(() => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  }, [songs, playSong]);

  // Delete song
  const deleteSong = useCallback(async (songId: string) => {
    if (!user) return;

    try {
      const song = songs.find(s => s.id === songId);
      if (!song) return;

      // Check if user owns the song
      if (song.uploaded_by !== user.id) {
        toast({
          title: "Non autorisé",
          description: "Vous ne pouvez supprimer que vos propres musiques",
          variant: "destructive",
        });
        return;
      }

      // Delete from storage if file_path exists
      if (song.file_path) {
        await supabase.storage
          .from('music-files')
          .remove([song.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Musique supprimée avec succès",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la musique",
        variant: "destructive",
      });
    }
  }, [user, songs, toast]);

  return {
    songs,
    playerState,
    isUploading,
    addSongs,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    playAllSongs,
    deleteSong,
  };
};