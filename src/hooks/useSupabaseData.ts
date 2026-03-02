import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Divisions ───
export function useDivisions() {
  return useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('divisions').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── User Companies ───
export function useUserCompanies() {
  return useQuery({
    queryKey: ['user_companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_companies').select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

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
    mutationFn: async (input: { name: string; description?: string }) => {
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
      name: string; description?: string; company_id: string; division_id: string;
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
      await supabase.from('task_assignees').delete().eq('task_id', taskId);
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
      environment?: string; bug_severity?: string; code?: string;
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

// ─── Members (Profiles + Roles from user_companies) ───
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;

      const { data: userCompanies } = await supabase.from('user_companies').select('*');
      const roleOrder: Record<string, number> = { owner: 0, super_admin: 1, admin: 2, member: 3 };
      const roleMap = new Map<string, string>();

      (userCompanies || []).forEach(uc => {
        const existing = roleMap.get(uc.user_id);
        if (!existing || (roleOrder[uc.role] ?? 9) < (roleOrder[existing] ?? 9)) {
          roleMap.set(uc.user_id, uc.role);
        }
      });

      return (profiles || []).map(p => ({
        ...p,
        role: roleMap.get(p.id) || 'member',
      }));
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; email?: string; position?: string; division_id?: string | null; company_id?: string; avatar?: string }) => {
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
      const { error } = await supabase.from('user_companies').update({ role: role as any }).eq('user_id', userId);
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
      position?: string; division_id?: string; company_id?: string; role?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-member', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
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

// ─── Notes (Private Notepad) ───
export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; content?: string; user_id: string }) => {
      const { data, error } = await supabase.from('notes').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; title?: string; content?: string }) => {
      const { data, error } = await supabase.from('notes').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}
