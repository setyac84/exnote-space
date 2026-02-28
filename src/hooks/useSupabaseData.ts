import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Companies ───
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; parent_id?: string | null }) => {
      const { data, error } = await supabase.from('companies').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase.from('companies').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

// ─── Projects ───
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string; description?: string; company_id: string; division: string;
      status?: string; priority?: string; start_date?: string; end_date?: string;
    }) => {
      const { data, error } = await supabase.from('projects').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('projects').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ─── Tasks ───
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Task Assignees ───
export function useTaskAssignees() {
  return useQuery({
    queryKey: ['task_assignees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_assignees').select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSetTaskAssignees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, assigneeIds }: { taskId: string; assigneeIds: string[] }) => {
      // Delete existing assignees for this task
      await supabase.from('task_assignees').delete().eq('task_id', taskId);
      // Insert new assignees
      if (assigneeIds.length > 0) {
        const rows = assigneeIds.map(aid => ({ task_id: taskId, assignee_id: aid }));
        const { error } = await supabase.from('task_assignees').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_assignees'] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string; description?: string; project_id: string; assignee_id?: string;
      status?: string; priority?: string; request_date?: string; due_date?: string;
      moodboard_link?: string; aspect_ratio?: string; brand_guidelines?: string;
      result_link?: string; content_asset_link?: string; repo_link?: string;
      environment?: string; bug_severity?: string;
    }) => {
      const { data, error } = await supabase.from('tasks').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// ─── Members (Profiles + Roles) ───
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;

      const { data: roles } = await supabase.from('user_roles').select('*');
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      return (profiles || []).map(p => ({
        ...p,
        role: (roleMap.get(p.id) as string) || 'member',
      }));
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; email?: string; position?: string; division?: string; company_id?: string; avatar?: string }) => {
      const { data, error } = await supabase.from('profiles').update(input as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('user_roles').update({ role: role as any }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string; password: string; name: string;
      position?: string; division?: string; company_id?: string; role?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-member', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useRegisterCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      company_name: string; email: string; password: string; name: string; position?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('register-company', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-member', { body: { user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useResetMemberPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('reset-member-password', {
        body: { user_id: userId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
}
