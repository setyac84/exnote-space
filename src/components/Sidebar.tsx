import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Briefcase,
  Palette,
  Code2,
  Building2,
  ListTodo,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division } from '@/types';

const Sidebar = () => {
  const { user, logout, activeDivision, setActiveDivision, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    ...(isAdmin ? [
      { to: '/company', icon: Building2, label: 'Company' },
      { to: '/members', icon: Users, label: 'Members' },
    ] : []),
  ];

  const divisionOptions: { value: Division; label: string; icon: typeof Palette }[] = [
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'developer', label: 'Developer', icon: Code2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const canSwitchDivision = isSuperAdmin;

  return (
    <aside className="fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50 w-48">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-3 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-sm">ProjectHub</span>
      </div>

      {/* Division Switcher */}
      {canSwitchDivision && (
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Division</p>
          <div className="space-y-0.5">
            {divisionOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setActiveDivision(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-2.5 py-1.5',
                  activeDivision === opt.value
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <opt.icon className="w-4 h-4 shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex-1 pt-3 px-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Menu</p>
        <div className="space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg text-sm transition-colors px-2.5 py-1.5',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors px-2.5 py-1.5"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
