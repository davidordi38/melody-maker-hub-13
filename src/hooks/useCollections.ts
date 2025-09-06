import { useState, useCallback } from 'react';
import { MusicCollection } from '@/types/collection';
import { Song } from '@/types/music';

export const useCollections = () => {
  const [collections, setCollections] = useState<MusicCollection[]>([]);

  const createCollection = useCallback((name: string) => {
    const collection: MusicCollection = {
      id: `collection-${Date.now()}`,
      name,
      songIds: [],
      createdAt: new Date(),
    };
    
    setCollections(prev => [...prev, collection]);
    return collection;
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const addSongToCollection = useCallback((songId: string, collectionId: string) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        const songExists = collection.songIds.includes(songId);
        if (!songExists) {
          return {
            ...collection,
            songIds: [...collection.songIds, songId],
          };
        }
      }
      return collection;
    }));
  }, []);

  const addSongsToCollection = useCallback((songIds: string[], collectionId: string) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        const newSongIds = songIds.filter(id => !collection.songIds.includes(id));
        return {
          ...collection,
          songIds: [...collection.songIds, ...newSongIds],
        };
      }
      return collection;
    }));
  }, []);

  const removeSongFromCollection = useCallback((songId: string, collectionId: string) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          songIds: collection.songIds.filter(id => id !== songId),
        };
      }
      return collection;
    }));
  }, []);

  const getCollectionSongs = useCallback((collection: MusicCollection, allSongs: Song[]) => {
    return allSongs.filter(song => collection.songIds.includes(song.id));
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