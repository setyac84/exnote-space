export type UserRole = 'owner' | 'super_admin' | 'admin' | 'member';
export type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'ongoing' | 'completed' | 'archived';

export interface Division {
  id: string;
  name: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: UserRole;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  division_id: string | null;
  company_id: string;
  position?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  division_id: string;
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
  moodboard_link?: string;
  aspect_ratio?: string;
  brand_guidelines?: string;
  result_link?: string;
  content_asset_link?: string;
  repo_link?: string;
  environment?: 'staging' | 'production';
  bug_severity?: 'low' | 'medium' | 'high' | 'critical';
}
