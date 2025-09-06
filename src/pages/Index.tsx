import React, { useState } from 'react';
import { Music2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useCollections } from '@/hooks/useCollections';
import { CompactFileUpload } from '@/components/CompactFileUpload';
import { SearchBar } from '@/components/SearchBar';
import { SongCard } from '@/components/SongCard';
import { MusicPlayer } from '@/components/MusicPlayer';
import { CollectionManager } from '@/components/CollectionManager';
import { PlaylistManager } from '@/components/PlaylistManager';
import { Song, Playlist } from '@/types/music';
import { MusicCollection } from '@/types/collection';
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
    playAllSongs,
    playPlaylist,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    getPlaylistSongs,
  } = useMusicPlayer();

  const {
    collections,
    createCollection,
    deleteCollection,
    addSongsToCollection,
    getCollectionSongs,
  } = useCollections();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<MusicCollection | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentView, setCurrentView] = useState<'all' | 'collections' | 'playlists'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingToCollection, setUploadingToCollection] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = async (files: FileList, collectionId?: string) => {
    const isUploadingToSpecificCollection = !!collectionId;
    
    if (isUploadingToSpecificCollection) {
      setUploadingToCollection(collectionId);
    } else {
      setIsUploading(true);
    }
    
    try {
      const newSongs = await addSongs(files);
      
      if (collectionId && newSongs.length > 0) {
        const songIds = newSongs.map(song => song.id);
        addSongsToCollection(songIds, collectionId);
        const collection = collections.find(c => c.id === collectionId);
        toast({
          title: "Musiques ajoutées",
          description: `${newSongs.length} chanson${newSongs.length !== 1 ? 's' : ''} ajoutée${newSongs.length !== 1 ? 's' : ''} à "${collection?.name}".`,
        });
      } else {
        toast({
          title: "Musiques importées",
          description: `${newSongs.length} chanson${newSongs.length !== 1 ? 's' : ''} importée${newSongs.length !== 1 ? 's' : ''} avec succès.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Une erreur s'est produite lors de l'importation des fichiers.",
        variant: "destructive",
      });
    } finally {
      if (isUploadingToSpecificCollection) {
        setUploadingToCollection(null);
      } else {
        setIsUploading(false);
      }
    }
  };

  const handleSongPlay = (song: Song) => {
    let currentSongs = songs;
    
    if (selectedCollection) {
      currentSongs = getCollectionSongs(selectedCollection, songs);
    } else if (selectedPlaylist) {
      currentSongs = getPlaylistSongs(selectedPlaylist);
    }
    
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

  const handlePlayCollection = (collection: MusicCollection) => {
    const collectionSongs = getCollectionSongs(collection, songs);
    if (collectionSongs.length > 0) {
      playSong(collectionSongs[0], collectionSongs);
    }
  };

  const handlePlayAllSongs = () => {
    if (songs.length === 0) return;
    playSong(songs[0], songs);
  };

  const handleUploadToCollection = (collection: MusicCollection) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.mp3,audio/mpeg,audio/mp3';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        handleFilesSelected(files, collection.id);
      }
    };
    input.click();
  };

  const filteredSongs = () => {
    let currentSongs = songs;
    
    if (selectedCollection) {
      currentSongs = getCollectionSongs(selectedCollection, songs);
    } else if (selectedPlaylist) {
      currentSongs = getPlaylistSongs(selectedPlaylist);
    }
    
    if (!searchQuery) return currentSongs;
    
    return currentSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getCurrentViewTitle = () => {
    if (selectedCollection) return selectedCollection.name;
    if (selectedPlaylist) return selectedPlaylist.name;
    return 'Toutes les musiques';
  };

  const handleViewChange = (view: 'all' | 'collections' | 'playlists') => {
    setCurrentView(view);
    setSelectedCollection(null);
    setSelectedPlaylist(null);
  };

  const getSongCount = (collection: MusicCollection) => {
    return getCollectionSongs(collection, songs).length;
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
              <h1 className="text-2xl font-bold text-foreground">MyMusic</h1>
              <p className="text-muted-foreground">Votre bibliothèque musicale personnelle</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {songs.length === 0 && (
          <div className="mb-8 text-center">
            <div className="max-w-md mx-auto">
              <Music2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Bienvenue dans MyMusic
              </h2>
              <p className="text-muted-foreground mb-6">
                Commencez par importer vos premières musiques pour créer votre bibliothèque personnelle.
              </p>
              <CompactFileUpload
                onFilesSelected={(files) => handleFilesSelected(files)}
                isUploading={isUploading}
                text="Importer mes musiques"
              />
            </div>
          </div>
        )}

        {songs.length > 0 && (
          <>
            {/* Navigation Tabs */}
            <div className="mb-8">
              <div className="flex gap-4 mb-6">
                <Button
                  variant={currentView === 'all' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('all')}
                >
                  Toutes les musiques ({songs.length})
                </Button>
                <Button
                  variant={currentView === 'collections' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('collections')}
                >
                  Collections ({collections.length})
                </Button>
                <Button
                  variant={currentView === 'playlists' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('playlists')}
                >
                  Playlists ({playlists.length})
                </Button>
              </div>

              {/* Collection Manager */}
              {currentView === 'collections' && (
                <CollectionManager
                  collections={collections}
                  selectedCollection={selectedCollection}
                  onCreateCollection={createCollection}
                  onSelectCollection={(collection) => {
                    setSelectedCollection(collection);
                    setSelectedPlaylist(null);
                  }}
                  onDeleteCollection={deleteCollection}
                  onPlayCollection={handlePlayCollection}
                  onUploadToCollection={handleUploadToCollection}
                  getSongCount={getSongCount}
                  totalSongs={songs.length}
                />
              )}

              {/* Playlist Manager */}
              {currentView === 'playlists' && (
                <PlaylistManager
                  playlists={playlists}
                  onCreatePlaylist={createPlaylist}
                  onDeletePlaylist={deletePlaylist}
                  onSelectPlaylist={(playlist) => {
                    setSelectedPlaylist(playlist);
                    setSelectedCollection(null);
                  }}
                  selectedPlaylist={selectedPlaylist}
                />
              )}
            </div>

            {/* Search and Add More */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Rechercher dans ${getCurrentViewTitle()}...`}
                />
              </div>
              {currentView !== 'playlists' && (
                <CompactFileUpload
                  onFilesSelected={(files) => handleFilesSelected(files)}
                  isUploading={isUploading}
                  variant="compact"
                />
              )}
            </div>

            {/* Current View Title */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {getCurrentViewTitle()}
                </h2>
                <p className="text-muted-foreground">
                  {displayedSongs.length} chanson{displayedSongs.length !== 1 ? 's' : ''}
                  {searchQuery && ` • Recherche: "${searchQuery}"`}
                </p>
              </div>
              {displayedSongs.length > 0 && (currentView === 'all' || selectedCollection || selectedPlaylist) && (
                <Button
                  onClick={() => {
                    if (selectedCollection) {
                      handlePlayCollection(selectedCollection);
                    } else if (selectedPlaylist) {
                      playPlaylist(selectedPlaylist);
                    } else {
                      handlePlayAllSongs();
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Lancer {selectedCollection ? 'la collection' : selectedPlaylist ? 'la playlist' : 'toutes les musiques'}
                </Button>
              )}
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
                    {searchQuery ? 'Aucune chanson trouvée' : selectedCollection ? 'Aucune chanson dans cette collection' : 'Aucune chanson'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Essayez de modifier votre recherche' 
                      : selectedCollection 
                        ? 'Utilisez le bouton "Upload" sur la collection pour ajouter des musiques' 
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
