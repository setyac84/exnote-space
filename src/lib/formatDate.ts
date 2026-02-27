import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMMM');
  } catch {
    return dateStr;
  }
};
