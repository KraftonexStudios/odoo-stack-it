
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX, Crown, Shield, Clock } from "lucide-react";

type CommunityMember = {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  status: string;
  joined_at: string;
  block_reason: string | null;
  blocked_at: string | null;
  blocked_by_id: string | null;
  user_name: string | null;
  user_email: string;
};

interface JoinRequestResponse {
  success: boolean;
  message: string;
}

interface CommunityManagementProps {
  communityId: string;
  userRole: string;
}

export const CommunityManagement = ({ communityId, userRole }: CommunityManagementProps) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { toast } = useToast();

  const canManageMembers = userRole === "OWNER" || userRole === "MODERATOR";

  useEffect(() => {
    if (canManageMembers) {
      fetchMembers();
    }
  }, [communityId, canManageMembers]);

  const fetchMembers = async () => {
    try {
      // First get community members
      const { data: membersData, error: membersError } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false });

      if (membersError) throw membersError;

      // Then get user details for each member
      const membersWithUserDetails = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: userData } = await supabase
            .from("users")
            .select("name, email")
            .eq("id", member.user_id)
            .single();

          return {
            ...member,
            user_name: userData?.name || null,
            user_email: userData?.email || "Unknown User"
          };
        })
      );
      
      const activeMembers = membersWithUserDetails.filter(member => member.status === "ACTIVE");
      const pending = membersWithUserDetails.filter(member => member.status === "PENDING");

      setMembers(activeMembers);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error loading members",
        description: "Failed to load community members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (userId: string, action: "approve" | "deny") => {
    setActionLoading(userId);

    try {
      const { data, error } = await supabase.rpc("manage_join_request", {
        p_community_id: communityId,
        p_user_id: userId,
        p_action: action
      });

      if (error) throw error;

      const response = data as unknown as JoinRequestResponse;
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });

        // Send notification to the user about the decision
        const member = pendingRequests.find(m => m.user_id === userId);
        if (member) {
          const notificationMessage = action === 'approve' 
            ? 'Your request to join the community has been approved!'
            : 'Your request to join the community has been denied.';
          
          await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: action === 'approve' ? 'COMMUNITY_INVITATION' : 'COMMUNITY_ANNOUNCEMENT',
            p_message: notificationMessage,
            p_community_id: communityId
          });
        }

        fetchMembers(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error managing join request:", error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-purple-600" />;
      case "MODERATOR":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge className="bg-purple-100 text-purple-800">Owner</Badge>;
      case "MODERATOR":
        return <Badge className="bg-blue-100 text-blue-800">Moderator</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  if (!canManageMembers) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            You don't have permission to manage this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading community members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Community Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Join Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getRoleIcon(member.role)}
                      <div>
                        <p className="font-medium">
                          {member.user_name || member.user_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending join requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium">
                          {request.user_name || request.user_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested {new Date(request.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequest(request.user_id, "approve")}
                        disabled={actionLoading === request.user_id}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequest(request.user_id, "deny")}
                        disabled={actionLoading === request.user_id}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
