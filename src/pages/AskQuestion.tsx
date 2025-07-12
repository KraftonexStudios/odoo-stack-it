
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, HelpCircle, FileText, Tags } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileUpload } from "@/components/upload/FileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Separator } from "@/components/ui/separator";

type Community = Tables<"communities">;
type Tag = Tables<"tags">;

export const AskQuestion = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; type: 'image' | 'video' }>>([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      // Fetch communities where user is an active member
      const { data: communitiesData } = await supabase
        .from("communities")
        .select(`
          *,
          community_members!inner(*)
        `)
        .eq("community_members.user_id", user.id)
        .eq("community_members.status", "ACTIVE");

      if (communitiesData) {
        setCommunities(communitiesData);
        if (communitiesData.length > 0) {
          setSelectedCommunity(communitiesData[0].id);
        }
      }

      // Fetch tags
      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (tagsData) {
        setAvailableTags(tagsData);
      }
    };

    fetchData();
  }, [user, navigate]);

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (
      trimmedTag &&
      !selectedTags.includes(trimmedTag) &&
      selectedTags.length < 5
    ) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleFileUploaded = (url: string, type: 'image' | 'video') => {
    setUploadedFiles(prev => [...prev, { url, type }]);
  };

  const handleFileRemoved = (url: string) => {
    setUploadedFiles(prev => prev.filter(file => file.url !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim() || !selectedCommunity) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare attachments data
      const attachments = uploadedFiles.length > 0 ? {
        files: uploadedFiles
      } : null;

      // Create the question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          title: title.trim(),
          description,
          author_id: user.id,
          community_id: selectedCommunity,
          attachments,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Handle tags
      if (selectedTags.length > 0) {
        // First, create any new tags that don't exist
        for (const tagName of selectedTags) {
          const { error: tagError } = await supabase
            .from("tags")
            .upsert({ name: tagName }, { onConflict: "name" });

          if (tagError) console.error("Error creating tag:", tagError);
        }

        // Get tag IDs
        const { data: tags } = await supabase
          .from("tags")
          .select("*")
          .in("name", selectedTags);

        if (tags) {
          // Create question-tag relationships
          const questionTags = tags.map((tag) => ({
            question_id: question.id,
            tag_id: tag.id,
          }));

          await supabase.from("question_tags").insert(questionTags);
        }
      }

      toast({
        title: "Question posted!",
        description: "Your question has been posted successfully.",
      });

      navigate(`/question/${question.id}`);
    } catch (error) {
      toast({
        title: "Error posting question",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ask a Question
          </h1>
        </div>
        <p className="text-muted-foreground">
          Get help from the community by asking a detailed question
        </p>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Question Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {communities.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Join a Community First</h3>
              <p className="text-muted-foreground mb-4">
                You need to join a community before asking questions.
              </p>
              <Button onClick={() => navigate("/communities")}>
                Browse Communities
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-medium">
                  Question Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your programming question? Be specific and clear."
                  required
                  className="text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Be specific and imagine you're asking a question to another person
                </p>
              </div>

              <Separator />

              {/* Community Selection */}
              <div className="space-y-3">
                <Label htmlFor="community" className="text-base font-medium">
                  Community *
                </Label>
                <select
                  id="community"
                  value={selectedCommunity}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background text-base focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.title}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Question Description *
                </Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Describe your problem in detail. Include:
• What you were trying to do
• What you expected to happen
• What actually happened
• Any error messages
• Code snippets (if relevant)
• What you've already tried

You can mention users with @username"
                  communityId={selectedCommunity}
                />
                <p className="text-sm text-muted-foreground">
                  The more details you provide, the better answers you'll receive
                </p>
              </div>

              <Separator />

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Attachments (Optional)
                </Label>
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={handleFileRemoved}
                  uploadedFiles={uploadedFiles}
                  maxFiles={5}
                />
                <p className="text-sm text-muted-foreground">
                  Upload screenshots, diagrams, or videos to help explain your question
                </p>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-3">
                <Label htmlFor="tags" className="text-base font-medium flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Tags (up to 5)
                </Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1 text-sm"
                    >
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add relevant tags (press Enter or comma to add)"
                  disabled={selectedTags.length >= 5}
                  className="text-base"
                />
                {tagInput && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags
                      .filter(
                        (tag) =>
                          tag.name.includes(tagInput.toLowerCase()) &&
                          !selectedTags.includes(tag.name)
                      )
                      .slice(0, 8)
                      .map((tag) => (
                        <Button
                          key={tag.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag.name)}
                          disabled={selectedTags.length >= 5}
                          className="h-8 text-xs"
                        >
                          {tag.name}
                        </Button>
                      ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Tags help others find and answer your question
                </p>
              </div>

              <Separator />

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 h-12 text-base font-medium"
                >
                  {loading ? "Posting Question..." : "Post Your Question"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="px-8 h-12 text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
