
import { useState } from 'react';
import { Upload, X, Image, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUploaded: (url: string, type: 'image' | 'video') => void;
  onFileRemoved: (url: string) => void;
  uploadedFiles: Array<{ url: string; type: 'image' | 'video' }>;
  maxFiles?: number;
}

export const FileUpload = ({ 
  onFileUploaded, 
  onFileRemoved, 
  uploadedFiles, 
  maxFiles = 5 
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (uploadedFiles.length >= maxFiles) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload up to ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    const fileSize = file.size / 1024 / 1024; // Convert to MB
    if (fileSize > 50) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('question-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('question-attachments')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      onFileUploaded(data.publicUrl, fileType);

      toast({
        title: "File uploaded successfully",
        description: `Your ${fileType} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading your file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeFile = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      await supabase.storage
        .from('question-attachments')
        .remove([filePath]);

      onFileRemoved(url);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading || uploadedFiles.length >= maxFiles}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload Image/Video'}
        </label>
        <span className="text-sm text-muted-foreground">
          {uploadedFiles.length}/{maxFiles} files
        </span>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-card rounded-lg overflow-hidden border">
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt="Uploaded file"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={file.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {file.type === 'image' ? (
                    <Image className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeFile(file.url)}
                    className="p-1 h-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
