export type Division = 'creative' | 'developer' | 'management';
export type UserRole = 'super_admin' | 'admin' | 'member';
export type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'ongoing' | 'completed' | 'archived';

export interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  division: Division;
  company_id: string;
  position?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  division: Division;
  company_id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  priority: TaskPriority;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  project_id: string;
  request_date: string;
  due_date: string;
  // Creative fields
  moodboard_link?: string;
  aspect_ratio?: string;
  brand_guidelines?: string;
  result_link?: string;
  content_asset_link?: string;
  // Developer fields
  repo_link?: string;
  environment?: 'staging' | 'production';
  bug_severity?: 'low' | 'medium' | 'high' | 'critical';
}
