
-- Create a function to auto-update project status based on task statuses
CREATE OR REPLACE FUNCTION public.update_project_status_from_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_tasks INTEGER;
  done_tasks INTEGER;
  current_status project_status;
BEGIN
  -- Get the project's current status
  SELECT status INTO current_status FROM public.projects WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Don't auto-update if project is archived (manual override)
  IF current_status = 'archived' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count tasks for this project
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO total_tasks, done_tasks
  FROM public.tasks
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND archived = false;

  -- Update project status based on task completion
  IF total_tasks > 0 AND done_tasks = total_tasks THEN
    UPDATE public.projects SET status = 'completed' WHERE id = COALESCE(NEW.project_id, OLD.project_id) AND status != 'archived';
  ELSIF done_tasks > 0 THEN
    UPDATE public.projects SET status = 'ongoing' WHERE id = COALESCE(NEW.project_id, OLD.project_id) AND status NOT IN ('archived', 'ongoing');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on tasks table
CREATE TRIGGER trigger_update_project_status
AFTER INSERT OR UPDATE OF status ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_project_status_from_tasks();
