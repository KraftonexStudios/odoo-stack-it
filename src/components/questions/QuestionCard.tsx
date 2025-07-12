
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, CheckCircle, User, Clock, Image, Video, ArrowUpRight, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { AttachmentDisplay } from '@/components/attachments/AttachmentDisplay';
import { useState } from 'react';

type Question = Tables<'questions'> & {
  users: { name: string | null; email: string } | null;
  communities: { title: string } | null;
  answer_count?: number;
  vote_count?: number;
  tags?: { name: string }[];
  has_accepted_answer?: boolean;
};

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getAttachmentPreview = () => {
    if (!question.attachments) return null;
    
    try {
      const attachments = typeof question.attachments === 'string' 
        ? JSON.parse(question.attachments) 
        : question.attachments;
      
      if (!attachments?.files || attachments.files.length === 0) return null;

      const imageCount = attachments.files.filter((f: any) => f.type === 'image').length;
      const videoCount = attachments.files.filter((f: any) => f.type === 'video').length;

      return (
        <div className="flex items-center gap-2 mt-3">
          {imageCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">
              <Image className="w-3 h-3" />
              <span>{imageCount} image{imageCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {videoCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/30 rounded-full text-xs font-medium text-purple-600 dark:text-purple-400">
              <Video className="w-3 h-3" />
              <span>{videoCount} video{videoCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      );
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="relative group animate-slide-up">
      {/* Enhanced thread connection line */}
      <div className="absolute left-7 top-0 w-0.5 h-full bg-gradient-to-b from-border/40 via-border/20 to-transparent group-last:h-16"></div>
      
      {/* Enhanced thread node */}
      <div className="absolute left-5 top-6 w-4 h-4 bg-background border-2 border-border rounded-full z-10 group-hover:border-primary/60 group-hover:bg-primary/10 transition-all duration-300 group-hover:scale-110">
        <div className="absolute inset-1 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <Card 
        className={`ml-14 transition-all duration-300 cursor-pointer border-0 border-l-2 border-l-transparent hover:border-l-primary/40 bg-card/80 backdrop-blur-sm hover:bg-card shadow-soft hover:shadow-medium ${
          isHovered ? 'card-focused' : ''
        }`}
        onClick={() => navigate(`/question/${question.id}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          {/* Enhanced header with author info and metadata */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">
                    {question.users?.name || question.users?.email?.split('@')[0] || 'Anonymous'}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{getTimeAgo(question.created_at)}</span>
                  </div>
                  {question.communities && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary bg-primary/5 font-medium">
                        {question.communities.title}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {question.has_accepted_answer && (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-2.5 py-1 font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Solved
                </Badge>
              )}
              <ArrowUpRight className={`w-4 h-4 text-muted-foreground transition-all duration-300 ${
                isHovered ? 'opacity-100 transform translate-x-0.5 -translate-y-0.5' : 'opacity-0'
              }`} />
            </div>
          </div>

          {/* Enhanced question content */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-body-lg hover:text-primary transition-colors duration-200">
              {question.title}
            </h3>
            
            <p className="text-muted-foreground leading-relaxed line-clamp-3 text-body">
              {stripHtml(question.description)}
            </p>

            {/* Attachments preview */}
            {getAttachmentPreview()}

            {/* Enhanced tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.tags.slice(0, 4).map((tag) => (
                  <Badge 
                    key={tag.name} 
                    variant="secondary" 
                    className="text-xs px-2.5 py-1 bg-secondary/60 hover:bg-secondary/80 transition-colors duration-200 font-medium"
                  >
                    {tag.name}
                  </Badge>
                ))}
                {question.tags.length > 4 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2.5 py-1 bg-secondary/60 font-medium"
                  >
                    +{question.tags.length - 4} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Enhanced footer stats */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/stat">
                <MessageSquare className="w-4 h-4 group-hover/stat:text-primary transition-colors" />
                <span className="font-semibold">{question.answer_count || 0}</span>
                <span className="text-xs hidden sm:inline font-medium">
                  answer{(question.answer_count || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/stat">
                <ThumbsUp className="w-4 h-4 group-hover/stat:text-primary transition-colors" />
                <span className="font-semibold">{question.vote_count || 0}</span>
                <span className="text-xs hidden sm:inline font-medium">
                  vote{(question.vote_count || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span className="font-medium">Click to join discussion</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
