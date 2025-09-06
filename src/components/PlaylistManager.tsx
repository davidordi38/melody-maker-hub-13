import React, { useState } from 'react';
import { Plus, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Playlist } from '@/types/music';

interface PlaylistManagerProps {
  playlists: Playlist[];
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectPlaylist: (playlist: Playlist | null) => void;
  selectedPlaylist: Playlist | null;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylist,
  selectedPlaylist
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Mes Playlists</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nom de la playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreatePlaylist}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map(playlist => (
          <Card
            key={playlist.id}
            className={`p-4 cursor-pointer transition-all duration-300 hover:bg-music-surface-hover group ${
              selectedPlaylist?.id === playlist.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectPlaylist(playlist)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-primary/10">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {playlist.songs.length} chanson{playlist.songs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};