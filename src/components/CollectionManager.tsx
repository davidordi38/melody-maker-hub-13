import React, { useState } from 'react';
import { Plus, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MusicCollection } from '@/types/collection';
import { CollectionCard } from './CollectionCard';

interface CollectionManagerProps {
  collections: MusicCollection[];
  selectedCollection: MusicCollection | null;
  onCreateCollection: (name: string) => void;
  onSelectCollection: (collection: MusicCollection | null) => void;
  onDeleteCollection: (id: string) => void;
  onPlayCollection: (collection: MusicCollection) => void;
  onUploadToCollection: (collection: MusicCollection) => void;
  getSongCount: (collectionId: string) => number;
  totalSongs: number;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({
  collections,
  selectedCollection,
  onCreateCollection,
  onSelectCollection,
  onDeleteCollection,
  onPlayCollection,
  onUploadToCollection,
  getSongCount,
  totalSongs
}) => {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Collections</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nom de la collection (ex: Ziak, Rap français...)"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateCollection}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Toutes les musiques */}
        <Card
          className={`p-4 cursor-pointer transition-all duration-300 hover:bg-muted/50 ${
            !selectedCollection ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectCollection(null)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Toutes les musiques</h3>
              <p className="text-sm text-muted-foreground">
                {totalSongs} chanson{totalSongs !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        {/* Collections */}
        {collections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            songCount={getSongCount(collection.id)}
            isSelected={selectedCollection?.id === collection.id}
            onSelect={() => onSelectCollection(collection)}
            onPlay={() => onPlayCollection(collection)}
            onUpload={() => onUploadToCollection(collection)}
            onDelete={() => onDeleteCollection(collection.id)}
          />
        ))}
      </div>
    </div>
  );
};