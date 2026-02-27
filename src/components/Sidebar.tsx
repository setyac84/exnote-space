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
  const { user, logout, activeDivision, setActiveDivision, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/company', icon: Building2, label: 'Company' },
    { to: '/members', icon: Users, label: 'Member' },
  ];

  const divisionOptions: { value: Division; label: string; icon: typeof Palette }[] = [
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'developer', label: 'Developer', icon: Code2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Super admin and regular admin can switch divisions
  const canSwitchDivision = isSuperAdmin;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="h-14 flex items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-sm">ProjectHub</span>
      </div>

      {/* Division Switcher - super_admin sees both, admin sees both */}
      {canSwitchDivision && (
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Divisi</p>
          <div className="space-y-1">
            {divisionOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setActiveDivision(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeDivision === opt.value
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 pt-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Menu</p>
        <div className="space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role} · {user.division}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
