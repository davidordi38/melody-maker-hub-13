import { useState, useEffect } from 'react';
import { useSupabaseCollections } from './useSupabaseCollections';

export const useCollectionSongCount = (collectionId: string) => {
  const [songCount, setSongCount] = useState(0);
  const { getCollectionSongs } = useSupabaseCollections();

  useEffect(() => {
    const loadSongCount = async () => {
      try {
        const songs = await getCollectionSongs(collectionId);
        setSongCount(songs.length);
      } catch (error) {
        console.error('Error loading song count:', error);
        setSongCount(0);
      }
    };

    if (collectionId) {
      loadSongCount();
    }
  }, [collectionId, getCollectionSongs]);

  return songCount;
};