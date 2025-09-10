import React, { useState } from 'react';
import { Plus, Music, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaylistWithSongs } from '@/hooks/useSupabasePlaylists';
import { LocalSong } from '@/hooks/useSupabaseMusicPlayer';

interface PlaylistManagerProps {
  songs: LocalSong[];
  playlists: PlaylistWithSongs[];
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddSongToPlaylist: (songId: string, playlistId: string) => void;
  onRemoveSongFromPlaylist: (songId: string, playlistId: string) => void;
  onPlaySong: (song: LocalSong, queue?: LocalSong[]) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  songs,
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
  onPlaySong,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithSongs | null>(null);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsDialogOpen(false);
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistWithSongs) => {
    if (playlist.songs.length > 0) {
      onPlaySong(playlist.songs[0], playlist.songs);
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
            className="p-4 transition-all duration-300 hover:bg-muted/50 group"
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
              <div className="flex gap-2">
                {playlist.songs.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayPlaylist(playlist)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeletePlaylist(playlist.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Song list for the playlist */}
            {playlist.songs.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Musiques:</h4>
                {playlist.songs.map(song => (
                  <div key={song.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <div>
                      <span className="font-medium">{song.title}</span>
                      {song.artist && <span className="text-muted-foreground"> - {song.artist}</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlaySong(song)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveSongFromPlaylist(song.id, playlist.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};