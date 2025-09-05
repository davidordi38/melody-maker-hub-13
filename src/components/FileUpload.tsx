import React, { useRef } from 'react';
import { Upload, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  isUploading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary transition-colors duration-300 cursor-pointer"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mp3"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            {isUploading ? (
              <Music className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isUploading ? 'Importation en cours...' : 'Importer des musiques'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Glissez vos fichiers MP3 ici ou cliquez pour sélectionner
            </p>
            <Button variant="music" disabled={isUploading}>
              {isUploading ? 'Importation...' : 'Choisir des fichiers'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};