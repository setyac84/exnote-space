import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths, isSameDay, isSameMonth, isToday } from 'date-fns';
import { motion } from 'framer-motion';

const statusColor: Record<string, string> = {
  todo: 'bg-muted-foreground/20 border-l-muted-foreground', doing: 'bg-info/10 border-l-info',
  review: 'bg-warning/10 border-l-warning', done: 'bg-success/10 border-l-success',
};
const statusLabel: Record<string, string> = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const priorityDot: Record<string, string> = { low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive' };

interface TaskCalendarProps {
  tasks: any[];
  members?: any[];
  onTaskClick: (task: any) => void;
}

type ViewMode = 'weekly' | 'monthly';

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, members = [], onTaskClick }) => {
  const [view, setView] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    if (view === 'weekly') {
      return eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const firstDay = start.getDay();
      const padStart = firstDay === 0 ? 6 : firstDay - 1;
      const calStart = new Date(start); calStart.setDate(calStart.getDate() - padStart);
      const lastDay = end.getDay();
      const padEnd = lastDay === 0 ? 0 : 7 - lastDay;
      const calEnd = new Date(end); calEnd.setDate(calEnd.getDate() + padEnd);
      return eachDayOfInterval({ start: calStart, end: calEnd });
    }
  }, [view, currentDate]);

  const getTasksForDay = (day: Date) => tasks.filter(t => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && isSameDay(due, day);
  });

  const navigate = (dir: 'prev' | 'next') => {
    if (view === 'weekly') setCurrentDate(dir === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const headerLabel = view === 'weekly'
    ? `${format(days[0], 'd MMM')} – ${format(days[days.length - 1], 'd MMM yyyy')}`
    : format(currentDate, 'MMMM yyyy');

  const TaskChip = ({ task, compact = false }: { task: any; compact?: boolean }) => {
    const assignee = members.find(u => u.id === task.assignee_id);
    return (
      <div onClick={() => onTaskClick(task)}
        className={cn('border-l-2 rounded-r-md px-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity', statusColor[task.status])}>
        <p className={cn('font-medium text-foreground leading-tight line-clamp-1', compact ? 'text-[9px]' : 'text-[10px]')}>{task.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityDot[task.priority])} />
          <span className={cn('text-muted-foreground', compact ? 'text-[7px]' : 'text-[8px]')}>{statusLabel[task.status]}</span>
        </div>
        {assignee && <p className={cn('text-muted-foreground mt-0.5', compact ? 'text-[7px]' : 'text-[8px]')}>{assignee.name?.split(' ')[0]}</p>}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-4 sm:p-5 mb-6">
      {/* Header controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Task Calendar</h2>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5 text-xs">
            <button onClick={() => setView('weekly')} className={cn('px-3 py-1.5 rounded-md transition-colors', view === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>Weekly</button>
            <button onClick={() => setView('monthly')} className={cn('px-3 py-1.5 rounded-md transition-colors', view === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>Monthly</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('prev')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 text-xs rounded-lg hover:bg-secondary transition-colors text-muted-foreground">Today</button>
            <button onClick={() => navigate('next')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{headerLabel}</p>

      {/* WEEKLY VIEW */}
      {view === 'weekly' && (
        <>
          {/* Desktop: 7-column grid */}
          <div className="hidden sm:grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayTasks = getTasksForDay(day);
              return (
                <div key={day.toISOString()} className="min-h-[120px]">
                  <div className={cn('text-center py-1.5 rounded-lg mb-1 text-xs font-medium', isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                    {format(day, 'EEE')} <span className="ml-1">{format(day, 'd')}</span>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map(task => <TaskChip key={task.id} task={task} />)}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mobile: horizontal scroll with day columns */}
          <div className="sm:hidden overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-2" style={{ minWidth: `${days.length * 110}px` }}>
              {days.map(day => {
                const dayTasks = getTasksForDay(day);
                return (
                  <div key={day.toISOString()} className="flex-shrink-0" style={{ width: '110px' }}>
                    <div className={cn('text-center py-1.5 rounded-lg mb-1 text-xs font-medium', isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                      {format(day, 'EEEEE')} <span className="ml-1">{format(day, 'd')}</span>
                    </div>
                    <div className="space-y-1 min-h-[80px]">
                      {dayTasks.map(task => <TaskChip key={task.id} task={task} compact />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MONTHLY VIEW */}
      {view === 'monthly' && (
        <>
          {/* Desktop monthly */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayHeaders.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5 rounded-lg">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const dayTasks = getTasksForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                return (
                  <div key={day.toISOString()} className={cn('min-h-[90px] rounded-lg p-1 border border-transparent transition-colors',
                    !inMonth && 'opacity-30', isToday(day) && 'border-primary/40 bg-primary/5')}>
                    <p className={cn('text-[10px] font-medium mb-0.5 text-center', isToday(day) ? 'text-primary' : 'text-muted-foreground')}>{format(day, 'd')}</p>
                    <div className="space-y-0.5">
                      {dayTasks.map(task => <TaskChip key={task.id} task={task} compact />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile monthly: compact list-style per week */}
          <div className="sm:hidden">
            <div className="grid grid-cols-7 gap-px mb-1">
              {dayHeaders.map(d => (
                <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-1">{d[0]}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {days.map(day => {
                const dayTasks = getTasksForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                return (
                  <div key={day.toISOString()} className={cn('min-h-[60px] rounded-md p-0.5 border border-transparent transition-colors',
                    !inMonth && 'opacity-30', isToday(day) && 'border-primary/40 bg-primary/5')}>
                    <p className={cn('text-[9px] font-medium mb-0.5 text-center', isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground')}>{format(day, 'd')}</p>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map(task => (
                        <div key={task.id} onClick={() => onTaskClick(task)}
                          className={cn('border-l-2 rounded-r-sm px-0.5 py-0.5 cursor-pointer', statusColor[task.status])}>
                          <p className="text-[7px] font-medium text-foreground leading-tight line-clamp-1">{task.title}</p>
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[7px] text-muted-foreground text-center">+{dayTasks.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TaskCalendar;
