import React, { useState } from 'react';
import { Music2 } from 'lucide-react';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { FileUpload } from '@/components/FileUpload';
import { SearchBar } from '@/components/SearchBar';
import { SongCard } from '@/components/SongCard';
import { MusicPlayer } from '@/components/MusicPlayer';
import { PlaylistManager } from '@/components/PlaylistManager';
import { Song, Playlist } from '@/types/music';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    songs,
    playlists,
    playerState,
    addSongs,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    getPlaylistSongs,
  } = useMusicPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = async (files: FileList) => {
    setIsUploading(true);
    try {
      const newSongs = await addSongs(files);
      toast({
        title: "Musiques importées",
        description: `${newSongs.length} chanson${newSongs.length !== 1 ? 's' : ''} ajoutée${newSongs.length !== 1 ? 's' : ''} avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Une erreur s'est produite lors de l'importation des fichiers.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSongPlay = (song: Song) => {
    const currentSongs = selectedPlaylist ? getPlaylistSongs(selectedPlaylist) : songs;
    if (playerState.currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, currentSongs);
    }
  };

  const handleAddToPlaylist = (songId: string, playlistId: string) => {
    addSongToPlaylist(songId, playlistId);
    const playlist = playlists.find(p => p.id === playlistId);
    toast({
      title: "Chanson ajoutée",
      description: `Chanson ajoutée à la playlist "${playlist?.name}".`,
    });
  };

  const filteredSongs = () => {
    const currentSongs = selectedPlaylist ? getPlaylistSongs(selectedPlaylist) : songs;
    if (!searchQuery) return currentSongs;
    
    return currentSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const displayedSongs = filteredSongs();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-music-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">MusicPlayer</h1>
              <p className="text-muted-foreground">Votre bibliothèque musicale personnelle</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {songs.length === 0 && (
          <div className="mb-8">
            <FileUpload onFilesSelected={handleFilesSelected} isUploading={isUploading} />
          </div>
        )}

        {songs.length > 0 && (
          <>
            {/* Playlist Manager */}
            <div className="mb-8">
              <PlaylistManager
                playlists={playlists}
                onCreatePlaylist={createPlaylist}
                onDeletePlaylist={deletePlaylist}
                onSelectPlaylist={setSelectedPlaylist}
                selectedPlaylist={selectedPlaylist}
              />
            </div>

            {/* Search and Add More */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={selectedPlaylist ? `Rechercher dans ${selectedPlaylist.name}...` : "Rechercher une chanson..."}
                />
              </div>
              <FileUpload onFilesSelected={handleFilesSelected} isUploading={isUploading} />
            </div>

            {/* Current View Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedPlaylist ? selectedPlaylist.name : 'Toutes les musiques'}
              </h2>
              <p className="text-muted-foreground">
                {displayedSongs.length} chanson{displayedSongs.length !== 1 ? 's' : ''}
                {searchQuery && ` • Recherche: "${searchQuery}"`}
              </p>
            </div>

            {/* Songs List */}
            <div className="space-y-3">
              {displayedSongs.length > 0 ? (
                displayedSongs.map(song => (
                  <SongCard
                    key={song.id}
                    song={song}
                    isPlaying={playerState.isPlaying}
                    isCurrentSong={playerState.currentSong?.id === song.id}
                    onPlay={() => handleSongPlay(song)}
                    onAddToPlaylist={(playlistId) => handleAddToPlaylist(song.id, playlistId)}
                    playlists={playlists}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery ? 'Aucune chanson trouvée' : 'Aucune chanson dans cette playlist'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Essayez de modifier votre recherche' 
                      : selectedPlaylist 
                        ? 'Ajoutez des chansons à cette playlist' 
                        : 'Importez vos premières musiques'
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Music Player */}
      <MusicPlayer
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onPlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        queue={playerState.queue}
      />
    </div>
  );
};

export default Index;
