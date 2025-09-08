import { useState, useEffect, useCallback } from 'react';
import { supabase, Collection as SupabaseCollection } from '@/lib/supabase';
import { LocalSong } from '@/hooks/useSupabaseMusicPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CollectionWithSongs extends SupabaseCollection {
  songs: LocalSong[];
}

export const useSupabaseCollections = () => {
  const [collections, setCollections] = useState<SupabaseCollection[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load collections from Supabase
  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  // Setup real-time subscription for collections
  useEffect(() => {
    if (!user) return;

    const collectionsChannel = supabase
      .channel('collections-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collections' },
        () => loadCollections()
      )
      .subscribe();

    const collectionSongsChannel = supabase
      .channel('collection-songs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collection_songs' },
        () => loadCollections()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(collectionsChannel);
      supabase.removeChannel(collectionSongsChannel);
    };
  }, [user]);

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les collections",
        variant: "destructive",
      });
    }
  };

  const createCollection = useCallback(async (name: string, description?: string, color?: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour créer une collection",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name,
          description,
          color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Collection créée",
        description: `La collection "${name}" a été créée`,
      });

      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la collection",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const deleteCollection = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id); // Ensure user can only delete their own collections

      if (error) throw error;

      toast({
        title: "Collection supprimée",
        description: "La collection a été supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

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
        // If it's a duplicate key error, it's not really an error
        if (error.code === '23505') {
          toast({
            title: "Musique déjà dans la collection",
            description: "Cette musique est déjà dans la collection",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Musique ajoutée",
        description: "La musique a été ajoutée à la collection",
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

  const addSongsToCollection = useCallback(async (songIds: string[], collectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collection_songs')
        .insert(
          songIds.map(songId => ({
            collection_id: collectionId,
            song_id: songId,
          }))
        );

      if (error) throw error;

      toast({
        title: "Musiques ajoutées",
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
        title: "Musique supprimée",
        description: "La musique a été supprimée de la collection",
      });
    } catch (error) {
      console.error('Error removing song from collection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la musique de la collection",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const getCollectionSongs = useCallback(async (collectionId: string): Promise<LocalSong[]> => {
    try {
      const { data, error } = await supabase
        .from('collection_songs')
        .select(`
          song_id,
          songs (
            id,
            title,
            artist,
            duration,
            file_path,
            file_url,
            uploaded_by,
            created_at,
            updated_at
          )
        `)
        .eq('collection_id', collectionId);

      if (error) throw error;

      // Convert to LocalSongs
      const songs: LocalSong[] = await Promise.all(
        (data || []).map(async (item: any) => {
          const song = item.songs;
          let url = song.file_url;
          
          // If no file_url, try to get it from storage
          if (!url && song.file_path) {
            const { data: urlData } = supabase.storage
              .from('music-files')
              .getPublicUrl(song.file_path);
            url = urlData.publicUrl;
          }

          return {
            ...song,
            url: url || '',
          };
        })
      );

      return songs;
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
    loadCollections,
  };
};