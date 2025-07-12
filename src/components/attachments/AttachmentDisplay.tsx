
import { useState } from 'react';
import { Play, Pause, Download, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface AttachmentFile {
  url: string;
  type: 'image' | 'video';
}

interface AttachmentDisplayProps {
  attachments: {
    files: AttachmentFile[];
  } | null;
}

export const AttachmentDisplay = ({ attachments }: AttachmentDisplayProps) => {
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());

  if (!attachments?.files || attachments.files.length === 0) {
    return null;
  }

  const toggleVideo = (url: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const downloadFile = async (url: string, type: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attachment.${type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.files.map((file, index) => (
          <div key={index} className="group relative bg-card rounded-lg overflow-hidden border border-border/50 hover:border-border transition-colors">
            {file.type === 'image' ? (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer">
                    <img
                      src={file.url}
                      alt="Attachment"
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                  <div className="relative">
                    <img
                      src={file.url}
                      alt="Attachment"
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => downloadFile(file.url, 'image')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="relative">
                <video
                  src={file.url}
                  className="w-full h-48 object-cover"
                  controls={playingVideos.has(file.url)}
                  poster={file.url}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleVideo(file.url)}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {playingVideos.has(file.url) ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadFile(file.url, file.type)}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
