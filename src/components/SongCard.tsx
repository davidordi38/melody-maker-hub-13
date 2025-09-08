import React from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SongCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    duration: number;
  };
  isPlaying: boolean;
  onPlay: () => void;
  onDelete?: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  onPlay,
  onDelete,
}) => {
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 transition-all duration-300 hover:bg-white/5 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlay}
            className="text-white hover:text-primary hover:bg-white/10 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-white">
              {song.title}
            </h3>
            <p className="text-white/70 text-sm truncate">
              {song.artist || 'Artiste inconnu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">
            {formatDuration(song.duration)}
          </span>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};