import { format, parseISO } from 'date-fns';

/** Task dates: "25 Feb" */
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMM');
  } catch {
    return dateStr;
  }
};

/** Project dates: "26 Mar 2026" */
export const formatDateFull = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
};
