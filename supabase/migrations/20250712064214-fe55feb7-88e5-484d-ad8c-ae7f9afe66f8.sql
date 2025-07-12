
-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_question_id UUID DEFAULT NULL,
  p_answer_id UUID DEFAULT NULL,
  p_community_id UUID DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, message, link, question_id, answer_id, community_id, target_user_id
  )
  VALUES (
    p_user_id, p_type, p_message, p_link, p_question_id, p_answer_id, p_community_id, p_target_user_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function for new answers
CREATE OR REPLACE FUNCTION notify_question_answered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  question_author_id UUID;
  question_title TEXT;
  answerer_name TEXT;
BEGIN
  -- Get question author and title
  SELECT author_id, title INTO question_author_id, question_title
  FROM questions 
  WHERE id = NEW.question_id;
  
  -- Get answerer name
  SELECT COALESCE(name, email) INTO answerer_name
  FROM users 
  WHERE id = NEW.author_id;
  
  -- Don't notify if user answered their own question
  IF question_author_id != NEW.author_id THEN
    PERFORM create_notification(
      question_author_id,
      'ANSWER_RECEIVED',
      answerer_name || ' answered your question: ' || question_title,
      '/question/' || NEW.question_id,
      NEW.question_id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new answers
DROP TRIGGER IF EXISTS trigger_notify_question_answered ON answers;
CREATE TRIGGER trigger_notify_question_answered
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_answered();

-- Function to extract mentions from text
CREATE OR REPLACE FUNCTION extract_mentions(content TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  mentions TEXT[];
BEGIN
  -- Extract @username patterns (simplified regex)
  SELECT array_agg(DISTINCT substring(match FROM 2))
  INTO mentions
  FROM regexp_split_to_table(content, '\s+') AS match
  WHERE match ~ '^@[a-zA-Z0-9_]+$';
  
  RETURN COALESCE(mentions, ARRAY[]::TEXT[]);
END;
$$;

-- Trigger function for mentions in answers
CREATE OR REPLACE FUNCTION notify_mentions_in_answer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mention TEXT;
  mentioned_user_id UUID;
  question_title TEXT;
  author_name TEXT;
BEGIN
  -- Get question title
  SELECT title INTO question_title
  FROM questions 
  WHERE id = NEW.question_id;
  
  -- Get author name
  SELECT COALESCE(name, email) INTO author_name
  FROM users 
  WHERE id = NEW.author_id;
  
  -- Process each mention
  FOR mention IN SELECT unnest(extract_mentions(NEW.content))
  LOOP
    -- Find user by name (case insensitive)
    SELECT id INTO mentioned_user_id
    FROM users 
    WHERE LOWER(name) = LOWER(mention) OR LOWER(email) = LOWER(mention || '@example.com')
    LIMIT 1;
    
    -- Create notification if user exists and it's not the author mentioning themselves
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
      PERFORM create_notification(
        mentioned_user_id,
        'MENTION',
        author_name || ' mentioned you in an answer to: ' || question_title,
        '/question/' || NEW.question_id,
        NEW.question_id,
        NEW.id,
        NULL,
        NEW.author_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger for mentions in answers
DROP TRIGGER IF EXISTS trigger_notify_mentions_in_answer ON answers;
CREATE TRIGGER trigger_notify_mentions_in_answer
  AFTER INSERT OR UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentions_in_answer();

-- Function to create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
