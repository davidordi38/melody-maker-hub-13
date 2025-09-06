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
      className={`p-4 cursor-pointer transition-all duration-300 hover:bg-music-surface-hover group ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1" onClick={onSelect}>
          <div className="p-2 rounded bg-primary/10">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{collection.name}</h3>
            <p className="text-sm text-muted-foreground">
              {songCount} chanson{songCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {songCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="text-primary hover:text-primary-hover"
              title="Lire la collection"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            className="text-foreground hover:text-primary"
            title="Ajouter des musiques"
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive hover:text-destructive"
            title="Supprimer la collection"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};