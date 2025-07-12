
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionList } from "@/components/questions/QuestionList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Activity, Users, TrendingUp, Sparkles } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Enhanced Hero Section */}
      <div className="border-b border-border/30 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center space-y-6 animate-slide-up">
            {/* Enhanced Logo and Title */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-soft">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-display font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  StackIt
                </h1>
                <p className="text-body-sm text-muted-foreground font-semibold tracking-wide">
                  Developer Community Hub
                </p>
              </div>
            </div>

            {/* Enhanced Tagline */}
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-body-lg font-medium text-foreground/90 leading-relaxed">
                Where developers connect, collaborate, and share knowledge
              </p>
              <p className="text-body text-muted-foreground leading-relaxed">
                Join thousands of passionate developers asking questions, sharing solutions, and building the future together
              </p>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-6">
              {!user ? (
                <>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="px-8 py-3 text-body font-semibold gradient-bg hover:opacity-90 transition-all duration-300 shadow-soft hover:shadow-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="px-8 py-3 text-body font-semibold border-border/50 hover:bg-accent/60 transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/ask")}
                  className="px-8 py-3 text-body font-semibold gradient-bg hover:opacity-90 transition-all duration-300 shadow-soft hover:shadow-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
              )}
            </div>

            {/* Enhanced Quick Stats */}
            <div className="flex items-center justify-center gap-8 pt-8 text-body-sm text-muted-foreground">
              <div className="flex items-center gap-2 group hover:text-foreground transition-colors">
                <Activity className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="font-medium">Active discussions</span>
              </div>
              <div className="flex items-center gap-2 group hover:text-foreground transition-colors">
                <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="font-medium">Growing community</span>
              </div>
              <div className="flex items-center gap-2 group hover:text-foreground transition-colors">
                <TrendingUp className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="font-medium">Knowledge sharing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div>
            <h2 className="text-heading font-semibold text-foreground">Community Discussions</h2>
            <p className="text-body-sm text-muted-foreground mt-2 font-medium">
              Latest questions and ongoing conversations from our developer community
            </p>
          </div>
          
          {user && (
            <Button
              onClick={() => navigate("/ask")}
              variant="outline"
              size="sm"
              className="font-medium border-border/50 hover:bg-accent/60 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          )}
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <QuestionList />
        </div>
      </div>
    </div>
  );
};

export default Index;
