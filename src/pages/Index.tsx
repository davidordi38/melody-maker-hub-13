import React, { useState, useEffect } from 'react';
import { Music2, Play, Upload, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseMusicPlayer } from '@/hooks/useSupabaseMusicPlayer';
import { useSupabaseCollections } from '@/hooks/useSupabaseCollections';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { SearchBar } from '@/components/SearchBar';
import { SongCard } from '@/components/SongCard';
import { MusicPlayer } from '@/components/MusicPlayer';
import { CollectionManager } from '@/components/CollectionManager';
import { PlaylistManager } from '@/components/PlaylistManager';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const {
    songs,
    playerState,
    addSongs,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    playAllSongs,
    isUploading,
    deleteSong,
  } = useSupabaseMusicPlayer();

  const {
    collections,
    createCollection,
    deleteCollection,
    addSongsToCollection,
    getCollectionSongs,
  } = useSupabaseCollections();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'all' | 'collections'>('all');
  const { toast } = useToast();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Music2 className="h-24 w-24 mx-auto mb-6 text-white/80" />
          <h1 className="text-4xl font-bold mb-4">Bibliothèque Musicale Partagée</h1>
          <p className="text-xl mb-8 text-white/80">
            Connectez-vous pour accéder à votre bibliothèque musicale synchronisée
          </p>
          <Button onClick={() => setShowAuthModal(true)} size="lg">
            Se connecter
          </Button>
        </div>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const handleFilesSelected = async (files: FileList) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    await addSongs(files);
  };

  const handleGeneralUpload = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.mp3,audio/mpeg,audio/mp3';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        handleFilesSelected(files);
      }
    };
    input.click();
  };

  const filteredSongs = () => {
    let currentSongs = songs;
    
    if (selectedCollection) {
      // For Supabase collections, we need to get songs differently
      // For now, just use all songs - we'll implement collection filtering later
      currentSongs = songs;
    }
    
    if (!searchQuery) return currentSongs;
    
    return currentSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getCurrentViewTitle = () => {
    if (selectedCollection) return selectedCollection.name;
    return 'Toutes les musiques';
  };

  const handleViewChange = (view: 'all' | 'collections') => {
    setCurrentView(view);
    setSelectedCollection(null);
  };

  const handlePlaySong = (song: any) => {
    playSong(song, filteredSongs());
  };

  const handleCollectionUpload = async (collectionId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.mp3,audio/mpeg,audio/mp3';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newSongs = await addSongs(files);
        const songIds = newSongs.map(song => song.id);
        addSongsToCollection(songIds, collectionId);
      }
    };
    input.click();
  };

  const handleCreateCollection = async (name: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    await createCollection(name);
  };

  const displayedSongs = filteredSongs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Music2 className="h-8 w-8" />
            Ma Bibliothèque Musicale
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              <span>{profile?.username || user?.email}</span>
            </div>
            <Button variant="outline" onClick={() => signOut()} className="text-white border-white hover:bg-white/10">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {songs.length === 0 && currentView === 'all' && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Music2 className="h-16 w-16 text-white/60 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-4">
                Votre bibliothèque partagée est vide
              </h2>
              <p className="text-muted-foreground mb-6">
                Commencez par importer vos premières musiques. Elles seront automatiquement synchronisées avec vos amis !
              </p>
              <button
                onClick={handleGeneralUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer mes musiques
                  </>
                )}
              </button>
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
                  className="text-white border-white"
                >
                  Toutes les musiques ({songs.length})
                </Button>
                <Button
                  variant={currentView === 'collections' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('collections')}
                  className="text-white border-white"
                >
                  Collections ({collections.length})
                </Button>
              </div>

              {/* Collection Manager */}
              {currentView === 'collections' && (
                <CollectionManager
                  collections={collections.map(c => ({
                    ...c,
                    songIds: [],
                    createdAt: new Date(c.created_at)
                  }))}
                  selectedCollection={selectedCollection}
                  onCreateCollection={handleCreateCollection}
                  onSelectCollection={(collection) => {
                    setSelectedCollection(collection);
                  }}
                  onDeleteCollection={deleteCollection}
                  onPlayCollection={() => {}}
                  onUploadToCollection={(collection) => handleCollectionUpload(collection.id)}
                  totalSongs={songs.length}
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
              <button
                onClick={handleGeneralUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Ajouter des musiques
                  </>
                )}
              </button>
            </div>

            {/* Current View Title */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {getCurrentViewTitle()}
                </h2>
                <p className="text-white/70">
                  {displayedSongs.length} chanson{displayedSongs.length !== 1 ? 's' : ''}
                  {searchQuery && ` • Recherche: "${searchQuery}"`}
                </p>
              </div>
              {displayedSongs.length > 0 && (
                <Button
                  onClick={playAllSongs}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Lancer toutes les musiques
                </Button>
              )}
            </div>

            {/* Songs List */}
            <div className="space-y-3">
              {displayedSongs.length > 0 ? (
                displayedSongs.map(song => (
                  <SongCard
                    key={song.id}
                    song={{
                      id: song.id,
                      title: song.title,
                      artist: song.artist || 'Artiste inconnu',
                      duration: song.duration,
                    }}
                    isPlaying={playerState.currentSong?.id === song.id && playerState.isPlaying}
                    onPlay={() => handlePlaySong(song)}
                    onDelete={user?.id === song.uploaded_by ? () => deleteSong(song.id) : undefined}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Music2 className="h-12 w-12 text-white/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchQuery ? 'Aucune chanson trouvée' : 'Aucune chanson'}
                  </h3>
                  <p className="text-white/70">
                    {searchQuery 
                      ? 'Essayez de modifier votre recherche' 
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