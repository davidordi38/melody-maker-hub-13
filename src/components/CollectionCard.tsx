import React from 'react';
import { Folder, Play, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MusicCollection } from '@/types/collection';

interface CollectionCardProps {
  collection: MusicCollection;
  songCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onUpload: () => void;
  onDelete: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  songCount,
  isSelected,
  onSelect,
  onPlay,
  onUpload,
  onDelete
}) => {
  return (
    <Card
      className={`p-5 cursor-pointer transition-all duration-300 hover:bg-music-surface-hover border-2 ${
        isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Folder className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{collection.name}</h3>
            <p className="text-sm text-muted-foreground">
              {songCount} chanson{songCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {songCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="flex-1 gap-2"
            >
              <Play className="h-4 w-4" />
              Lire
            </Button>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            className="flex-1 gap-2"
          >
            <Upload className="h-4 w-4" />
            Ajouter
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};