import { useState, useCallback } from 'react';
import { Song, Playlist, MusicPlayerState } from '@/types/music';

export const useMusicPlayer = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playerState, setPlayerState] = useState<MusicPlayerState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    queue: [],
    currentIndex: -1,
  });

  const addSongs = useCallback(async (files: FileList) => {
    const newSongs: Song[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log('Processing file:', file.name, 'Type:', file.type);
      // Accept various MP3 MIME types
      if (file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.name.toLowerCase().endsWith('.mp3')) {
        const url = URL.createObjectURL(file);
        
        // Créer un élément audio temporaire pour obtenir la durée
        const audio = new Audio(url);
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
          });
        });

        const song: Song = {
          id: `song-${Date.now()}-${i}`,
          title: file.name.replace('.mp3', ''),
          duration,
          file,
          url,
        };
        
        newSongs.push(song);
      }
    }
    
    setSongs(prevSongs => [...prevSongs, ...newSongs]);
    return newSongs;
  }, []);

  const playSong = useCallback((song: Song, queue?: Song[]) => {
    const currentQueue = queue || songs;
    const index = currentQueue.findIndex(s => s.id === song.id);
    
    setPlayerState({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: currentQueue,
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
          isPlaying: true,
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
          isPlaying: true,
        };
      }
      return prev;
    });
  }, []);


  const createPlaylist = useCallback((name: string) => {
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      songs: [],
      createdAt: new Date(),
    };
    
    setPlaylists(prev => [...prev, playlist]);
    return playlist;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const addSongToPlaylist = useCallback((songId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: [...playlist.songs, songId],
        };
      }
      return playlist;
    }));
  }, []);

  const getPlaylistSongs = useCallback((playlist: Playlist) => {
    return songs.filter(song => playlist.songs.includes(song.id));
  }, [songs]);

  const playAllSongs = useCallback(() => {
    if (songs.length === 0) return;
    playSong(songs[0], songs);
  }, [songs, playSong]);

  const playPlaylist = useCallback((playlist: Playlist) => {
    const playlistSongs = getPlaylistSongs(playlist);
    if (playlistSongs.length === 0) return;
    playSong(playlistSongs[0], playlistSongs);
  }, [getPlaylistSongs, playSong]);

  return {
    songs,
    playlists,
    playerState,
    addSongs,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    playAllSongs,
    playPlaylist,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    getPlaylistSongs,
  };
};