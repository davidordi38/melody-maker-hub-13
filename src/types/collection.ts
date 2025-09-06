export interface MusicCollection {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: Date;
  color?: string;
}

export interface CollectionWithSongs extends MusicCollection {
  songs: import('./music').Song[];
}