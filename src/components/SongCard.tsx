import React from 'react';
import { Play, Pause, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Song } from '@/types/music';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrentSong: boolean;
  onPlay: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  playlists: Array<{ id: string; name: string }>;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  isCurrentSong,
  onPlay,
  onAddToPlaylist,
  playlists
}) => {
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`p-4 transition-all duration-300 hover:bg-music-surface-hover cursor-pointer group ${
      isCurrentSong ? 'ring-2 ring-primary' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlay}
            className="text-foreground hover:text-primary hover:bg-music-surface-hover p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${
              isCurrentSong ? 'text-primary' : 'text-foreground'
            }`}>
              {song.title}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {song.artist || 'Artiste inconnu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {formatDuration(song.duration)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {playlists.map(playlist => (
                <DropdownMenuItem
                  key={playlist.id}
                  onClick={() => onAddToPlaylist(playlist.id)}
                >
                  Ajouter à {playlist.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};