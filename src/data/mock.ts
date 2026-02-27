import { User, Project, Task } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Andi Wijaya', email: 'andi@company.com', role: 'admin', division: 'creative', company_id: 'c1' },
  { id: '2', name: 'Budi Santoso', email: 'budi@company.com', role: 'member', division: 'creative', company_id: 'c1' },
  { id: '3', name: 'Citra Dewi', email: 'citra@company.com', role: 'member', division: 'creative', company_id: 'c1' },
  { id: '4', name: 'Dimas Prasetyo', email: 'dimas@company.com', role: 'admin', division: 'developer', company_id: 'c1' },
  { id: '5', name: 'Eka Putri', email: 'eka@company.com', role: 'member', division: 'developer', company_id: 'c1' },
  { id: '6', name: 'Fajar Rahman', email: 'fajar@company.com', role: 'member', division: 'developer', company_id: 'c1' },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Redesign Landing Page', description: 'Create new hero section with modern visuals', status: 'doing', priority: 'high', assignee_id: '2', project_id: 'p1', start_date: '2026-02-20', end_date: '2026-03-05', moodboard_link: 'https://pinterest.com/board1', aspect_ratio: '16:9' },
  { id: 't2', title: 'Social Media Kit', description: 'Design Instagram & LinkedIn post templates', status: 'todo', priority: 'medium', assignee_id: '3', project_id: 'p1', start_date: '2026-03-01', end_date: '2026-03-10' },
  { id: 't3', title: 'Logo Variant Exploration', description: 'Create 5 logo variants for client review', status: 'done', priority: 'high', assignee_id: '2', project_id: 'p1', start_date: '2026-02-15', end_date: '2026-02-25' },
  { id: 't4', title: 'Brand Color Palette', description: 'Define primary and secondary color system', status: 'review', priority: 'medium', assignee_id: '3', project_id: 'p1', start_date: '2026-02-18', end_date: '2026-02-28' },
  { id: 't5', title: 'Setup CI/CD Pipeline', description: 'Configure GitHub Actions for auto deployment', status: 'done', priority: 'urgent', assignee_id: '5', project_id: 'p2', start_date: '2026-02-10', end_date: '2026-02-18', repo_link: 'https://github.com/company/api', environment: 'production' },
  { id: 't6', title: 'User Auth API', description: 'Implement JWT-based authentication endpoints', status: 'doing', priority: 'high', assignee_id: '6', project_id: 'p2', start_date: '2026-02-20', end_date: '2026-03-01', repo_link: 'https://github.com/company/api', environment: 'staging' },
  { id: 't7', title: 'Database Schema Design', description: 'Design multi-tenant PostgreSQL schema', status: 'done', priority: 'high', assignee_id: '5', project_id: 'p2', start_date: '2026-02-08', end_date: '2026-02-15' },
  { id: 't8', title: 'API Rate Limiting', description: 'Implement rate limiting middleware', status: 'todo', priority: 'medium', assignee_id: '6', project_id: 'p2', start_date: '2026-03-05', end_date: '2026-03-12', environment: 'staging' },
  { id: 't9', title: 'Motion Graphics Intro', description: 'Create 10-second animated intro for YouTube', status: 'todo', priority: 'low', assignee_id: '2', project_id: 'p3', start_date: '2026-03-10', end_date: '2026-03-20' },
  { id: 't10', title: 'Thumbnail Templates', description: 'Design 3 YouTube thumbnail styles', status: 'doing', priority: 'medium', assignee_id: '3', project_id: 'p3', start_date: '2026-03-01', end_date: '2026-03-08' },
  { id: 't11', title: 'Fix Login Bug', description: 'Users unable to login with special characters in password', status: 'doing', priority: 'urgent', assignee_id: '5', project_id: 'p4', start_date: '2026-02-25', end_date: '2026-02-27', bug_severity: 'critical', environment: 'production' },
  { id: 't12', title: 'Dashboard Analytics', description: 'Build analytics dashboard with charts', status: 'todo', priority: 'high', assignee_id: '6', project_id: 'p4', start_date: '2026-03-01', end_date: '2026-03-15', repo_link: 'https://github.com/company/dashboard' },
];

export const mockProjects: Project[] = [
  { id: 'p1', name: 'Brand Refresh 2026', description: 'Complete brand identity overhaul including logo, colors, and templates', status: 'ongoing', division: 'creative', company_id: 'c1', created_at: '2026-02-10', tasks: mockTasks.filter(t => t.project_id === 'p1') },
  { id: 'p2', name: 'Backend API v2', description: 'Rebuild core API with improved auth, caching, and multi-tenant support', status: 'ongoing', division: 'developer', company_id: 'c1', created_at: '2026-02-05', tasks: mockTasks.filter(t => t.project_id === 'p2') },
  { id: 'p3', name: 'YouTube Campaign', description: 'Visual assets for Q2 YouTube marketing campaign', status: 'planning', division: 'creative', company_id: 'c1', created_at: '2026-02-28', tasks: mockTasks.filter(t => t.project_id === 'p3') },
  { id: 'p4', name: 'Client Portal', description: 'Customer-facing dashboard for project tracking and billing', status: 'ongoing', division: 'developer', company_id: 'c1', created_at: '2026-02-15', tasks: mockTasks.filter(t => t.project_id === 'p4') },
];

export const currentUser = mockUsers[0]; // Admin Creative
