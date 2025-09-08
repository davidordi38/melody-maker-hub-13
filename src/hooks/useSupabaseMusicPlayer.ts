import { useState, useEffect, useCallback } from 'react';
import { supabase, Song as SupabaseSong } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Local interface that includes the File object for playback
export interface LocalSong extends SupabaseSong {
  file?: File;
  url: string; // This will be the Supabase Storage URL or blob URL
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

  // Load songs from Supabase on mount and when user changes
  useEffect(() => {
    if (user) {
      loadSongs();
    }
  }, [user]);

  // Setup real-time subscription for songs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('songs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'songs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadSongs(); // Reload to get the new song with URL
          } else if (payload.eventType === 'DELETE') {
            setSongs(prev => prev.filter(song => song.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            loadSongs(); // Reload to get updated data
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert Supabase songs to LocalSongs with URLs
      const localSongs: LocalSong[] = await Promise.all(
        data.map(async (song) => {
          let url = song.file_url;
          
          // If no file_url, try to get it from storage
          if (!url && song.file_path) {
            const { data: urlData } = supabase.storage
              .from('music-files')
              .getPublicUrl(song.file_path);
            url = urlData.publicUrl;
          }

          return {
            ...song,
            url: url || '',
          };
        })
      );

      setSongs(localSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les musiques",
        variant: "destructive",
      });
    }
  };

  const addSongs = async (files: FileList): Promise<LocalSong[]> => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des musiques",
        variant: "destructive",
      });
      return [];
    }

    setIsUploading(true);
    const newSongs: LocalSong[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Create a unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          
          // Upload file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('music-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('music-files')
            .getPublicUrl(fileName);

          // Get audio metadata
          const duration = await getAudioDuration(file);
          const audioMetadata = await getAudioMetadata(file);

          // Insert song record in database
          const { data: songData, error: dbError } = await supabase
            .from('songs')
            .insert({
              title: audioMetadata.title || file.name.replace(/\.[^/.]+$/, ""),
              artist: audioMetadata.artist,
              duration: duration,
              file_path: fileName,
              file_url: urlData.publicUrl,
              uploaded_by: user.id,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          const localSong: LocalSong = {
            ...songData,
            file,
            url: urlData.publicUrl,
          };

          newSongs.push(localSong);

        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'ajouter ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (newSongs.length > 0) {
        toast({
          title: "Musiques ajoutées",
          description: `${newSongs.length} musique(s) ajoutée(s) avec succès`,
        });
      }

    } finally {
      setIsUploading(false);
    }

    return newSongs;
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  const getAudioMetadata = (file: File): Promise<{ title?: string; artist?: string }> => {
    return new Promise((resolve) => {
      // For now, just extract from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split(' - ');
      
      if (parts.length >= 2) {
        resolve({ artist: parts[0].trim(), title: parts[1].trim() });
      } else {
        resolve({ title: nameWithoutExt });
      }
    });
  };

  const playSong = useCallback((song: LocalSong, queue?: LocalSong[]) => {
    const newQueue = queue || [song];
    const index = newQueue.findIndex(s => s.id === song.id);
    
    setPlayerState({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      currentIndex: index >= 0 ? index : 0,
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  const playNext = useCallback(() => {
    setPlayerState(prev => {
      if (prev.currentIndex < prev.queue.length - 1) {
        const nextIndex = prev.currentIndex + 1;
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
      if (prev.currentIndex > 0) {
        const prevIndex = prev.currentIndex - 1;
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

  const deleteSong = async (songId: string) => {
    if (!user) return;

    try {
      // Get song info first
      const song = songs.find(s => s.id === songId);
      if (!song) return;

      // Delete from storage
      if (song.file_path) {
        await supabase.storage
          .from('music-files')
          .remove([song.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)
        .eq('uploaded_by', user.id); // Ensure user can only delete their own songs

      if (error) throw error;

      toast({
        title: "Musique supprimée",
        description: "La musique a été supprimée avec succès",
      });

    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la musique",
        variant: "destructive",
      });
    }
  };

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
    loadSongs,
  };
};