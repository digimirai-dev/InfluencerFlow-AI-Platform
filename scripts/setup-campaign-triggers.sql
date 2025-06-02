-- Setup Campaign Creation Triggers for AI Workflow
-- This script adds database triggers to automatically start AI workflows when campaigns are created

-- Function to call the campaign-created Edge Function
CREATE OR REPLACE FUNCTION trigger_campaign_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for newly created campaigns with 'active' status
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    PERFORM
      net.http_post(
        url := format('%s/functions/v1/campaign-created', current_setting('app.supabase_url')),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', format('Bearer %s', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'campaign_id', NEW.id::text,
          'brand_id', NEW.brand_id::text,
          'title', NEW.title
        )
      );
    
    -- Log the trigger action
    INSERT INTO ai_prompt_logs (
      user_id,
      prompt_type,
      prompt_text,
      response_text,
      tokens_used,
      cost,
      success
    ) VALUES (
      NEW.brand_id,
      'campaign_workflow_trigger',
      format('Campaign created: %s (ID: %s)', NEW.title, NEW.id),
      'AI workflow triggered via database trigger',
      0,
      0,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS campaign_created_trigger ON campaigns;
CREATE TRIGGER campaign_created_trigger
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_campaign_workflow();

-- Function to handle campaign status changes that should trigger AI actions
CREATE OR REPLACE FUNCTION trigger_campaign_status_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger AI workflow when campaign status changes to 'active'
  IF OLD.status != 'active' AND NEW.status = 'active' THEN
    PERFORM
      net.http_post(
        url := format('%s/functions/v1/campaign-created', current_setting('app.supabase_url')),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', format('Bearer %s', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'campaign_id', NEW.id::text,
          'brand_id', NEW.brand_id::text,
          'title', NEW.title,
          'trigger_type', 'status_change'
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the status change trigger
DROP TRIGGER IF EXISTS campaign_status_change_trigger ON campaigns;
CREATE TRIGGER campaign_status_change_trigger
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_campaign_status_workflow();

-- Show current triggers on campaigns table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'campaigns'
ORDER BY trigger_name; 