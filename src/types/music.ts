export interface Song {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  file: File;
  url: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: string[]; // Array of song IDs
  createdAt: Date;
}

export interface MusicPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  queue: Song[];
  currentIndex: number;
}