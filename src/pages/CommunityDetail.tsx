import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { CommunityManagement } from '@/components/community/CommunityManagement';
import { QuestionList } from '@/components/questions/QuestionList';

type Community = Tables<'communities'> & {
  users: { name: string | null; email: string } | null;
  member_count?: number;
};

type CommunityMember = {
  id: string;
  role: string;
  status: string;
  joined_at: string;
};

interface JoinRequestResponse {
  success: boolean;
  message: string;
}

export const CommunityDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [userMembership, setUserMembership] = useState<CommunityMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'management'>('questions');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchCommunityDetails();
    }
  }, [slug, user]);

  const fetchCommunityDetails = async () => {
    if (!slug) return;

    setLoading(true);

    try {
      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select(`
          *,
          users!communities_owner_id_fkey(name, email)
        `)
        .eq('slug', slug)
        .single();

      if (communityError) throw communityError;

      setCommunity(communityData);

      // Fetch user membership if logged in
      if (user && communityData) {
        const { data: membershipData } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', communityData.id)
          .eq('user_id', user.id)
          .single();

        setUserMembership(membershipData);
      }

      // Count members
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityData.id)
        .eq('status', 'ACTIVE');

      setCommunity(prev => prev ? { ...prev, member_count: count || 0 } : null);
    } catch (error) {
      console.error('Error fetching community:', error);
      toast({
        title: "Error loading community",
        description: "Failed to load community details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !community) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to join communities.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setJoining(true);

    try {
      const { data, error } = await supabase.rpc('handle_join_request', {
        p_community_id: community.id,
        p_user_id: user.id
      });

      if (error) throw error;

      const response = data as unknown as JoinRequestResponse;
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });

        // Send notification to community owner about the join request (only for private communities)
        if (community.visibility === 'PRIVATE') {
          await supabase.rpc('create_notification', {
            p_user_id: community.owner_id,
            p_type: 'COMMUNITY_JOIN_REQUEST',
            p_message: `${user.email} has requested to join your community "${community.title}"`,
            p_link: `/community/${community.slug}`,
            p_community_id: community.id,
            p_target_user_id: user.id
          });
        }
        
        // Refresh membership status
        fetchCommunityDetails();
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Error joining community",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const canManageCommunity = userMembership && ['OWNER', 'MODERATOR'].includes(userMembership.role);
  const isActiveMember = userMembership?.status === 'ACTIVE';
  const hasPendingRequest = userMembership?.status === 'PENDING';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Community not found.</p>
        <Button onClick={() => navigate('/communities')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Communities
        </Button>
      </div>
    );
  }

  // Check if user can see private community content
  const canViewContent = community.visibility === 'PUBLIC' || isActiveMember;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/communities')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Communities
      </Button>

      {/* Community Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{community?.title}</CardTitle>
                <Badge variant={community?.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                  {community?.visibility}
                </Badge>
              </div>
              {community?.description && (
                <p className="text-muted-foreground mb-4">{community.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{community?.member_count || 0} members</span>
                </div>
                <span>Owner: {community?.users?.name || community?.users?.email || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!user && (
                <Button onClick={() => navigate('/auth')}>
                  Sign In to Join
                </Button>
              )}
              
              {user && !userMembership && (
                <Button onClick={handleJoinCommunity} disabled={joining}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {joining ? 'Joining...' : 'Join Community'}
                </Button>
              )}
              
              {hasPendingRequest && (
                <Button variant="outline" disabled>
                  Request Pending
                </Button>
              )}
              
              {canManageCommunity && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === 'management' ? 'questions' : 'management')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {activeTab === 'management' ? 'View Questions' : 'Manage'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {!canViewContent ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              This is a private community. You need to be a member to view its content.
            </p>
            {user && !userMembership && (
              <Button onClick={handleJoinCommunity} disabled={joining}>
                <UserPlus className="w-4 h-4 mr-2" />
                {joining ? 'Sending Request...' : 'Request to Join'}
              </Button>
            )}
            {!user && (
              <Button onClick={() => navigate('/auth')}>
                Sign In to Request Access
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === 'management' && canManageCommunity ? (
            <CommunityManagement 
              communityId={community!.id} 
              userRole={userMembership?.role || 'MEMBER'} 
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Questions</h2>
                {isActiveMember && (
                  <Button onClick={() => navigate('/ask')}>
                    Ask Question
                  </Button>
                )}
              </div>
              <QuestionList communityId={community.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
