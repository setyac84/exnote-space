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
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division } from '@/types';
import { useSidebarCollapse } from '@/contexts/SidebarContext';

const Sidebar = () => {
  const { user, logout, activeDivision, setActiveDivision, isSuperAdmin } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();
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

  const canSwitchDivision = isSuperAdmin;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-foreground text-sm">ProjectHub</span>}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="mx-auto mt-3 mb-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {/* Division Switcher */}
      {canSwitchDivision && (
        <div className={cn('px-3 pt-2 pb-2', collapsed && 'px-2')}>
          {!collapsed && <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Divisi</p>}
          <div className="space-y-1">
            {divisionOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setActiveDivision(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  activeDivision === opt.value
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                title={collapsed ? opt.label : undefined}
              >
                <opt.icon className="w-4 h-4 shrink-0" />
                {!collapsed && opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className={cn('flex-1 pt-4', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Menu</p>}
        <div className="space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg text-sm transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className={cn('p-3 border-t border-sidebar-border space-y-2', collapsed && 'p-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role} · {user.division}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary" title={user.name}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
            collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
