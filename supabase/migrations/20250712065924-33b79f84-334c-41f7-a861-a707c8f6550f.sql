
-- Enable RLS for communities and community_members tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Anyone can view public communities" 
  ON communities 
  FOR SELECT 
  USING (visibility = 'PUBLIC');

CREATE POLICY "Members can view private communities" 
  ON communities 
  FOR SELECT 
  USING (
    visibility = 'PRIVATE' AND 
    id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Authenticated users can create communities" 
  ON communities 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Community owners can update their communities" 
  ON communities 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

-- RLS Policies for community_members
CREATE POLICY "Users can view community memberships" 
  ON community_members 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    community_id IN (
      SELECT id FROM communities WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can request to join communities" 
  ON community_members 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community owners and moderators can manage members" 
  ON community_members 
  FOR UPDATE 
  USING (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MODERATOR')
    )
  );

CREATE POLICY "Users can leave communities" 
  ON community_members 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Function to automatically add community owner as a member
CREATE OR REPLACE FUNCTION add_community_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'OWNER', 'ACTIVE');
  RETURN NEW;
END;
$$;

-- Trigger to add owner as member when community is created
DROP TRIGGER IF EXISTS trigger_add_community_owner ON communities;
CREATE TRIGGER trigger_add_community_owner
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION add_community_owner_as_member();

-- Function to handle join requests
CREATE OR REPLACE FUNCTION handle_join_request(
  p_community_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  community_visibility community_visibility;
  existing_member_status community_member_status;
  result JSONB;
BEGIN
  -- Check if community exists and get visibility
  SELECT visibility INTO community_visibility
  FROM communities
  WHERE id = p_community_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Community not found');
  END IF;
  
  -- Check if user is already a member
  SELECT status INTO existing_member_status
  FROM community_members
  WHERE community_id = p_community_id AND user_id = p_user_id;
  
  IF FOUND THEN
    IF existing_member_status = 'ACTIVE' THEN
      RETURN jsonb_build_object('success', false, 'message', 'Already a member');
    ELSIF existing_member_status = 'PENDING' THEN
      RETURN jsonb_build_object('success', false, 'message', 'Join request already pending');
    END IF;
  END IF;
  
  -- Handle based on community visibility
  IF community_visibility = 'PUBLIC' THEN
    -- Auto-approve for public communities
    INSERT INTO community_members (community_id, user_id, role, status)
    VALUES (p_community_id, p_user_id, 'MEMBER', 'ACTIVE')
    ON CONFLICT (community_id, user_id) 
    DO UPDATE SET status = 'ACTIVE', role = 'MEMBER';
    
    result = jsonb_build_object('success', true, 'message', 'Joined community successfully');
  ELSE
    -- Create pending request for private communities
    INSERT INTO community_members (community_id, user_id, role, status)
    VALUES (p_community_id, p_user_id, 'MEMBER', 'PENDING')
    ON CONFLICT (community_id, user_id) 
    DO UPDATE SET status = 'PENDING', role = 'MEMBER';
    
    result = jsonb_build_object('success', true, 'message', 'Join request sent');
  END IF;
  
  RETURN result;
END;
$$;

-- Function to approve/deny join requests
CREATE OR REPLACE FUNCTION manage_join_request(
  p_community_id UUID,
  p_user_id UUID,
  p_action TEXT, -- 'approve' or 'deny'
  p_moderator_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  moderator_role community_member_role;
BEGIN
  -- Check if the moderator has permission
  SELECT role INTO moderator_role
  FROM community_members
  WHERE community_id = p_community_id 
    AND user_id = p_moderator_id 
    AND status = 'ACTIVE'
    AND role IN ('OWNER', 'MODERATOR');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient permissions');
  END IF;
  
  -- Handle the action
  IF p_action = 'approve' THEN
    UPDATE community_members
    SET status = 'ACTIVE'
    WHERE community_id = p_community_id AND user_id = p_user_id AND status = 'PENDING';
    
    RETURN jsonb_build_object('success', true, 'message', 'Join request approved');
    
  ELSIF p_action = 'deny' THEN
    DELETE FROM community_members
    WHERE community_id = p_community_id AND user_id = p_user_id AND status = 'PENDING';
    
    RETURN jsonb_build_object('success', true, 'message', 'Join request denied');
    
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Invalid action');
  END IF;
END;
$$;

-- Enable real-time for community_members
ALTER TABLE community_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
