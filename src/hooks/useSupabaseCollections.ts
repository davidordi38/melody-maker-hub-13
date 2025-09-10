import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { LocalSong } from './useSupabaseMusicPlayer';

export interface SupabaseCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithSongs extends SupabaseCollection {
  songs: LocalSong[];
}

export const useSupabaseCollections = () => {
  const [collections, setCollections] = useState<CollectionWithSongs[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load collections from Supabase
  const loadCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load songs for each collection
      const collectionsWithSongs = await Promise.all(
        (data || []).map(async (collection) => {
          const songs = await getCollectionSongs(collection.id);
          return { ...collection, songs };
        })
      );

      setCollections(collectionsWithSongs);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (user) {
      loadCollections();
    }

    const collectionsChannel = supabase
      .channel('collections-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collections'
      }, () => {
        loadCollections();
      })
      .subscribe();

    const collectionSongsChannel = supabase
      .channel('collection-songs-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collection_songs'
      }, () => {
        loadCollections();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(collectionsChannel);
      supabase.removeChannel(collectionSongsChannel);
    };
  }, [user, loadCollections]);

  // Create collection
  const createCollection = useCallback(async (name: string, description?: string, color?: string) => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour créer une collection",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('collections')
        .insert({
          name,
          description,
          color,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Collection créée avec succès",
      });

    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Delete collection
  const deleteCollection = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const collection = collections.find(c => c.id === id);
      if (!collection) return;

      if (collection.created_by !== user.id) {
        toast({
          title: "Non autorisé",
          description: "Vous ne pouvez supprimer que vos propres collections",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Collection supprimée avec succès",
      });

    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la collection",
        variant: "destructive",
      });
    }
  }, [user, collections, toast]);

  // Add song to collection
  const addSongToCollection = useCallback(async (songId: string, collectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collection_songs')
        .insert({
          collection_id: collectionId,
          song_id: songId,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Information",
            description: "Cette musique est déjà dans la collection",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Succès",
        description: "Musique ajoutée à la collection",
      });

    } catch (error) {
      console.error('Error adding song to collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la musique à la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Add multiple songs to collection
  const addSongsToCollection = useCallback(async (songIds: string[], collectionId: string) => {
    if (!user) return;

    try {
      const insertData = songIds.map(songId => ({
        collection_id: collectionId,
        song_id: songId,
      }));

      const { error } = await supabase
        .from('collection_songs')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${songIds.length} musique(s) ajoutée(s) à la collection`,
      });

    } catch (error) {
      console.error('Error adding songs to collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les musiques à la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Remove song from collection
  const removeSongFromCollection = useCallback(async (songId: string, collectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collection_songs')
        .delete()
        .eq('collection_id', collectionId)
        .eq('song_id', songId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Musique retirée de la collection",
      });

    } catch (error) {
      console.error('Error removing song from collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer la musique de la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Get collection songs
  const getCollectionSongs = useCallback(async (collectionId: string): Promise<LocalSong[]> => {
    try {
      const { data, error } = await supabase
        .from('collection_songs')
        .select(`
          song_id,
          songs:songs (*)
        `)
        .eq('collection_id', collectionId);

      if (error) throw error;

      const songs = await Promise.all(
        (data || []).map(async (item: any) => {
          const song = item.songs;
          if (!song) return null;

          let url = song.file_url;
          if (!url && song.file_path) {
            const { data: urlData } = supabase.storage
              .from('music-files')
              .getPublicUrl(song.file_path);
            url = urlData.publicUrl;
          }

          return { ...song, url: url || '' };
        })
      );

      return songs.filter(Boolean);
    } catch (error) {
      console.error('Error getting collection songs:', error);
      return [];
    }
  }, []);

  return {
    collections,
    createCollection,
    deleteCollection,
    addSongToCollection,
    addSongsToCollection,
    removeSongFromCollection,
    getCollectionSongs,
  };
};