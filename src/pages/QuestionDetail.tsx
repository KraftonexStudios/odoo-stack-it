
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Calendar, ArrowLeft, MessageSquare, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { VotingButtons } from '@/components/answers/VotingButtons';
import { AttachmentDisplay } from '@/components/attachments/AttachmentDisplay';

type Question = Tables<'questions'> & {
  users: { name: string | null; email: string } | null;
  communities: { title: string; visibility: string } | null;
  tags: { name: string }[];
};

type Answer = Tables<'answers'> & {
  users: { name: string | null; email: string } | null;
  vote_count: number;
};

export const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userMembership, setUserMembership] = useState<{ status: string; role: string } | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchQuestionAndAnswers();
    }
  }, [id, user]);

  const fetchQuestionAndAnswers = async () => {
    if (!id) return;

    setLoading(true);

    // Fetch question with related data
    const { data: questionData } = await supabase
      .from('questions')
      .select(`
        *,
        users!questions_author_id_fkey(name, email),
        communities(title, visibility)
      `)
      .eq('id', id)
      .single();

    if (questionData) {
      // Fetch tags
      const { data: questionTags } = await supabase
        .from('question_tags')
        .select('tags(name)')
        .eq('question_id', id);

      const tags = questionTags?.map(qt => ({ name: qt.tags?.name || '' })) || [];

      setQuestion({ ...questionData, tags });

      // Check user membership for private communities
      if (user && questionData.communities?.visibility === 'PRIVATE') {
        const { data: membershipData } = await supabase
          .from('community_members')
          .select('status, role')
          .eq('community_id', questionData.community_id)
          .eq('user_id', user.id)
          .single();

        setUserMembership(membershipData);
      } else if (questionData.communities?.visibility === 'PUBLIC') {
        // For public communities, set a default membership
        setUserMembership({ status: 'ACTIVE', role: 'MEMBER' });
      }
    }

    // Fetch answers with vote counts
    const { data: answersData } = await supabase
      .from('answers')
      .select(`
        *,
        users!answers_author_id_fkey(name, email)
      `)
      .eq('question_id', id)
      .order('created_at', { ascending: true });

    if (answersData) {
      // Calculate vote counts for each answer
      const enrichedAnswers = await Promise.all(
        answersData.map(async (answer) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('type')
            .eq('answer_id', answer.id);

          const voteCount = votes?.reduce((sum, vote) => {
            return sum + (vote.type === 'UPVOTE' ? 1 : -1);
          }, 0) || 0;

          return { ...answer, vote_count: voteCount };
        })
      );

      // Sort answers: accepted first, then by vote count
      enrichedAnswers.sort((a, b) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        return b.vote_count - a.vote_count;
      });

      setAnswers(enrichedAnswers);
    }

    setLoading(false);
  };

  const canAnswer = () => {
    if (!user) return false;
    if (!question) return false;
    
    // For public communities, anyone can answer
    if (question.communities?.visibility === 'PUBLIC') return true;
    
    // For private communities, only active members can answer
    return userMembership?.status === 'ACTIVE';
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAnswer.trim() || !id) {
      toast({
        title: "Error",
        description: "Please sign in and write an answer.",
        variant: "destructive",
      });
      return;
    }

    if (!canAnswer()) {
      toast({
        title: "Permission denied",
        description: "You need to be a member of this community to answer questions.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: answer, error } = await supabase
        .from('answers')
        .insert({
          content: newAnswer,
          question_id: id,
          author_id: user.id,
        })
        .select(`
          *,
          users!answers_author_id_fkey(name, email)
        `)
        .single();

      if (error) throw error;

      // Add to answers list
      setAnswers(prev => [...prev, { ...answer, vote_count: 0 }]);
      setNewAnswer('');

      // Notification will be automatically created by database trigger

      toast({
        title: "Answer posted!",
        description: "Your answer has been posted successfully.",
      });
    } catch (error) {
      console.error('Error posting answer:', error);
      toast({
        title: "Error posting answer",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !question || question.author_id !== user.id) {
      toast({
        title: "Permission denied",
        description: "Only the question author can accept answers.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the question to set accepted answer
      const { error: questionError } = await supabase
        .from('questions')
        .update({ accepted_answer_id: answerId })
        .eq('id', question.id);

      if (questionError) throw questionError;

      // Update the answer to mark as accepted
      const { error: answerError } = await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      if (answerError) throw answerError;

      // Update local state
      setQuestion(prev => prev ? { ...prev, accepted_answer_id: answerId } : null);
      setAnswers(prev => prev.map(answer => ({
        ...answer,
        is_accepted: answer.id === answerId
      })));

      toast({
        title: "Answer accepted!",
        description: "The answer has been marked as accepted.",
      });
    } catch (error) {
      console.error('Error accepting answer:', error);
      toast({
        title: "Error accepting answer",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-muted-foreground">Question not found.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Button>
        </div>
      </div>
    );
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discussions
        </Button>

        {/* Question Thread */}
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden mb-8">
          <div className="relative">
            {/* Thread connection line for question */}
            <div className="absolute left-6 top-0 w-px h-full bg-border/30"></div>
            
            {/* Question node */}
            <div className="absolute left-4 top-6 w-4 h-4 bg-primary border-2 border-background rounded-full z-10"></div>
            
            {/* Question content */}
            <div className="ml-12 p-6">
              {/* Question header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">
                        {question.users?.name || question.users?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {getTimeAgo(question.created_at)}
                      </span>
                      {question.communities && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs px-2 py-0 border-primary/20 text-primary">
                            {question.communities.title}
                            {question.communities.visibility === 'PRIVATE' && (
                              <span className="ml-1 text-xs">(Private)</span>
                            )}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {question.accepted_answer_id && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Solved
                  </Badge>
                )}
              </div>

              {/* Question title and content */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  {question.title}
                </h1>
                
                <div className="prose max-w-none text-foreground/90" 
                     dangerouslySetInnerHTML={{ __html: question.description }} />

                {/* Display question attachments */}
                <AttachmentDisplay attachments={question.attachments as any} />

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                      <Badge key={tag.name} variant="secondary" className="text-xs px-2 py-1 bg-secondary/50">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Question stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span>{answers.length} answers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Thread */}
        {answers.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border/30 bg-background/50">
              <h2 className="text-lg font-semibold text-foreground">
                {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
              </h2>
            </div>
            
            <div className="relative">
              {answers.map((answer, index) => (
                <div key={answer.id} className="relative">
                  {/* Thread connection line */}
                  <div className="absolute left-6 top-0 w-px h-full bg-border/30 last:h-16"></div>
                  
                  {/* Answer node */}
                  <div className={`absolute left-4 top-6 w-4 h-4 border-2 border-background rounded-full z-10 ${
                    answer.is_accepted ? 'bg-green-500' : 'bg-background border-border'
                  }`}></div>
                  
                  {/* Answer content */}
                  <div className="ml-12 p-6 border-b border-border/30 last:border-b-0">
                    <div className="flex gap-4">
                      <VotingButtons 
                        answerId={answer.id}
                        initialVoteCount={answer.vote_count}
                      />
                      
                      <div className="flex-1 space-y-4">
                        {answer.is_accepted && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted Answer
                          </Badge>
                        )}
                        
                        <div className="prose max-w-none text-foreground/90" 
                             dangerouslySetInnerHTML={{ __html: answer.content }} />
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            <span>{answer.users?.name || answer.users?.email?.split('@')[0] || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{getTimeAgo(answer.created_at)}</span>
                          </div>
                          
                          {user && question.author_id === user.id && !answer.is_accepted && !question.accepted_answer_id && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcceptAnswer(answer.id)}
                              className="hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept Answer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* End of thread indicator */}
              <div className="px-6 py-4 text-center">
                <div className="w-6 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto"></div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Form */}
        {user && canAnswer() ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-background/50">
              <h3 className="text-lg font-semibold text-foreground">Your Answer</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <RichTextEditor
                  content={newAnswer}
                  onChange={setNewAnswer}
                  placeholder="Write your answer here... You can mention users with @username"
                  communityId={question.community_id}
                />
                <Button type="submit" disabled={submitting || !newAnswer.trim()}>
                  {submitting ? 'Posting...' : 'Post Answer'}
                </Button>
              </form>
            </div>
          </div>
        ) : user && !canAnswer() ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden text-center p-8">
            <p className="text-muted-foreground mb-4">
              You need to be a member of this community to post answers.
            </p>
            <Button onClick={() => navigate('/communities')}>
              View Communities
            </Button>
          </div>
        ) : (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden text-center p-8">
            <p className="text-muted-foreground mb-4">
              You need to be signed in to post an answer.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
