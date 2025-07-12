
import { useState, useEffect } from "react";
import { QuestionCard } from "./QuestionCard";
import { ThreadContainer } from "./ThreadContainer";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SortAsc, MessageSquare, Loader2, Filter, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Question = Tables<"questions"> & {
  users: { name: string | null; email: string } | null;
  communities: { title: string } | null;
  answer_count: number;
  vote_count: number;
  tags: { name: string }[];
  has_accepted_answer: boolean;
};

interface QuestionListProps {
  communityId?: string;
}

export const QuestionList = ({ communityId }: QuestionListProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_voted" | "unanswered">("newest");

  useEffect(() => {
    fetchQuestions();
  }, [sortBy, communityId]);

  const fetchQuestions = async () => {
    setLoading(true);

    let query = supabase.from("questions").select(`
        *,
        users!questions_author_id_fkey(name, email),
        communities(title)
      `);

    // Filter by community if communityId is provided
    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "most_voted":
        query = query.order("created_at", { ascending: false });
        break;
      case "unanswered":
        query = query.is("accepted_answer_id", null).order("created_at", { ascending: false });
        break;
    }

    const { data: questionsData } = await query.limit(20);

    if (questionsData) {
      // Fetch additional data for each question
      const enrichedQuestions = await Promise.all(
        questionsData.map(async (question) => {
          // Get answer count
          const { count: answerCount } = await supabase
            .from("answers")
            .select("*", { count: "exact", head: true })
            .eq("question_id", question.id);

          // Get tags
          const { data: questionTags } = await supabase
            .from("question_tags")
            .select("tags(name)")
            .eq("question_id", question.id);

          const tags = questionTags?.map((qt) => ({ name: qt.tags?.name || "" })) || [];

          // For questions, we don't need vote count since questions don't have votes in this system
          // Only answers have votes. Set vote_count to 0 for all questions
          return {
            ...question,
            answer_count: answerCount || 0,
            vote_count: 0, // Questions don't have votes, only answers do
            tags,
            has_accepted_answer: !!question.accepted_answer_id,
          };
        })
      );

      setQuestions(enrichedQuestions);
    }

    setLoading(false);
  };

  const filteredQuestions = questions.filter(
    (question) =>
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags?.some((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest":
        return "Latest";
      case "oldest":
        return "Oldest";
      case "most_voted":
        return "Most Voted";
      case "unanswered":
        return "Unanswered";
      default:
        return "Latest";
    }
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case "newest":
      case "oldest":
        return <SortAsc className="w-4 h-4" />;
      case "most_voted":
        return <TrendingUp className="w-4 h-4" />;
      case "unanswered":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <SortAsc className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Search and Filter Bar */}
      <div className="glass-morphism p-6 rounded-xl border border-border/30 sticky top-4 z-10 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search discussions, topics, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border/40 focus:border-primary/50 bg-background/50 backdrop-blur-sm text-body font-medium"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 min-w-fit border-border/40 bg-background/50 backdrop-blur-sm hover:bg-background/80 font-medium"
              >
                {getSortIcon()}
                <span className="hidden sm:inline text-body-sm">Sort:</span>
                <span className="font-semibold text-body-sm">{getSortLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border/40 bg-background/95 backdrop-blur-sm">
              <DropdownMenuItem 
                onClick={() => setSortBy("newest")} 
                className="hover:bg-accent/60 font-medium"
              >
                <SortAsc className="w-4 h-4 mr-2" />
                Latest First
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("oldest")} 
                className="hover:bg-accent/60 font-medium"
              >
                <SortAsc className="w-4 h-4 mr-2" />
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("most_voted")} 
                className="hover:bg-accent/60 font-medium"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Most Voted
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("unanswered")} 
                className="hover:bg-accent/60 font-medium"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Unanswered
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Results Summary */}
        {!loading && (
          <div className="pt-4 mt-4 border-t border-border/20">
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-muted-foreground font-medium">
                {searchTerm ? (
                  <>
                    <span className="text-foreground font-semibold">{filteredQuestions.length}</span> results for "
                    <span className="font-semibold text-primary">{searchTerm}</span>"
                  </>
                ) : (
                  <>
                    <span className="text-foreground font-semibold">{filteredQuestions.length}</span> active discussions
                  </>
                )}
              </p>
              
              {filteredQuestions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="w-3 h-3" />
                  <span className="font-medium">Sorted by {getSortLabel().toLowerCase()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Questions Thread */}
      {loading ? (
        <ThreadContainer title="Loading discussions...">
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-body-sm text-muted-foreground font-medium">Fetching latest discussions...</p>
            </div>
          </div>
        </ThreadContainer>
      ) : filteredQuestions.length > 0 ? (
        <ThreadContainer 
          title="Community Discussions" 
          subtitle={`${filteredQuestions.length} ongoing conversation${filteredQuestions.length !== 1 ? 's' : ''}`}
        >
          <div className="space-y-0">
            {filteredQuestions.map((question, index) => (
              <div key={question.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <QuestionCard question={question} />
              </div>
            ))}
          </div>
        </ThreadContainer>
      ) : (
        <ThreadContainer>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/20 rounded-full mb-6">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-heading font-semibold text-foreground mb-3">No discussions found</h3>
            <p className="text-body text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchTerm 
                ? "Try adjusting your search terms or filters to find what you're looking for." 
                : "Be the first to start a meaningful discussion in this community!"
              }
            </p>
          </div>
        </ThreadContainer>
      )}
    </div>
  );
};
