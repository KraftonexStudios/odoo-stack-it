import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityMember {
  id: string;
  name: string | null;
  email: string;
}

export const useCommunityMembers = (communityId: string | null) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (communityId) {
      fetchCommunityMembers();
    }
  }, [communityId]);

  const fetchCommunityMembers = async () => {
    if (!communityId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          users!community_members_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('community_id', communityId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      const membersList = data
        ?.map(item => item.users)
        .filter(user => user !== null)
        .map(user => ({
          id: user!.id,
          name: user!.name,
          email: user!.email
        })) || [];

      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching community members:', error);
    } finally {
      setLoading(false);
    }
  };

  return { members, loading };
};