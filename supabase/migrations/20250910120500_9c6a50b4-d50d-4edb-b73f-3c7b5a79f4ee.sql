-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public) VALUES ('music-files', 'music-files', true);

-- Create songs table
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER DEFAULT 0,
  file_path TEXT,
  file_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_songs junction table
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);

-- Create collection_songs junction table
CREATE TABLE public.collection_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, song_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for songs (everyone can read, only uploader can modify)
CREATE POLICY "Everyone can view songs" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Users can upload songs" ON public.songs FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update their own songs" ON public.songs FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete their own songs" ON public.songs FOR DELETE USING (auth.uid() = uploaded_by);

-- RLS Policies for playlists (everyone can read, only creator can modify)
CREATE POLICY "Everyone can view playlists" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Users can create playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own playlists" ON public.playlists FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for collections (everyone can read, only creator can modify)
CREATE POLICY "Everyone can view collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Users can create collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own collections" ON public.collections FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own collections" ON public.collections FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for playlist_songs (everyone can read, only playlist owner can modify)
CREATE POLICY "Everyone can view playlist songs" ON public.playlist_songs FOR SELECT USING (true);
CREATE POLICY "Playlist owners can add songs" ON public.playlist_songs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id AND created_by = auth.uid()
  )
);
CREATE POLICY "Playlist owners can remove songs" ON public.playlist_songs 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id AND created_by = auth.uid()
  )
);

-- RLS Policies for collection_songs (everyone can read, only collection owner can modify)
CREATE POLICY "Everyone can view collection songs" ON public.collection_songs FOR SELECT USING (true);
CREATE POLICY "Collection owners can add songs" ON public.collection_songs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE id = collection_id AND created_by = auth.uid()
  )
);
CREATE POLICY "Collection owners can remove songs" ON public.collection_songs 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE id = collection_id AND created_by = auth.uid()
  )
);

-- Storage policies for music files
CREATE POLICY "Anyone can view music files" ON storage.objects 
FOR SELECT USING (bucket_id = 'music-files');

CREATE POLICY "Authenticated users can upload music files" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'music-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own music files" ON storage.objects 
FOR UPDATE USING (bucket_id = 'music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own music files" ON storage.objects 
FOR DELETE USING (bucket_id = 'music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();