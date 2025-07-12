import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Vote = Tables<'votes'>;

interface VotingButtonsProps {
  answerId: string;
  initialVoteCount: number;
  onVoteChange?: (newCount: number) => void;
}

export const VotingButtons = ({ answerId, initialVoteCount, onVoteChange }: VotingButtonsProps) => {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<'UPVOTE' | 'DOWNVOTE' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, answerId]);

  const fetchUserVote = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('votes')
      .select('type')
      .eq('answer_id', answerId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserVote(data.type as 'UPVOTE' | 'DOWNVOTE');
    }
  };

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to vote.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // If user already voted the same way, remove the vote
      if (userVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', user.id);

        if (error) throw error;

        const change = voteType === 'UPVOTE' ? -1 : 1;
        setVoteCount(prev => prev + change);
        setUserVote(null);
        onVoteChange?.(voteCount + change);
      } else {
        // Remove existing vote if any
        if (userVote) {
          await supabase
            .from('votes')
            .delete()
            .eq('answer_id', answerId)
            .eq('user_id', user.id);
        }

        // Add new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            answer_id: answerId,
            user_id: user.id,
            type: voteType,
          });

        if (error) throw error;

        // Calculate vote change
        let change = 0;
        if (!userVote) {
          change = voteType === 'UPVOTE' ? 1 : -1;
        } else {
          change = voteType === 'UPVOTE' ? 2 : -2; // Switching from down to up or vice versa
        }

        setVoteCount(prev => prev + change);
        setUserVote(voteType);
        onVoteChange?.(voteCount + change);
      }

      toast({
        title: "Vote recorded",
        description: `Your ${voteType.toLowerCase()} has been recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error voting",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant={userVote === 'UPVOTE' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleVote('UPVOTE')}
        disabled={loading}
        className="p-2"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      
      <span className="font-semibold text-lg">
        {voteCount}
      </span>
      
      <Button
        variant={userVote === 'DOWNVOTE' ? 'destructive' : 'ghost'}
        size="sm"
        onClick={() => handleVote('DOWNVOTE')}
        disabled={loading}
        className="p-2"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  );
};