import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompactFileUploadProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
  variant?: 'default' | 'compact';
  text?: string;
}

export const CompactFileUpload: React.FC<CompactFileUploadProps> = ({
  onFilesSelected,
  isUploading,
  variant = 'default',
  text = 'Ajouter des musiques'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input pour permettre la sélection du même fichier
    event.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,audio/mpeg,audio/mp3"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        variant={variant === 'compact' ? 'outline' : 'default'}
        size={variant === 'compact' ? 'sm' : 'default'}
        className="gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {text}
      </Button>
    </>
  );
};