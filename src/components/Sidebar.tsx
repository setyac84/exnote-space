import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FolderKanban, LogOut, Palette, Code2,
  Building2, ListTodo, Users, Menu, X, PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division } from '@/types';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logoImg from '@/assets/logo.png';

const Sidebar = () => {
  const { user, logout, activeDivision, setActiveDivision, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!user) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    ...(isAdmin ? [
      { to: '/company', icon: Building2, label: 'Company' },
      { to: '/members', icon: Users, label: 'Members' },
    ] : []),
    ...(isSuperAdmin && !user.company_id ? [
      { to: '/register-company', icon: PlusCircle, label: 'Register Company' },
    ] : []),
  ];

  const divisionOptions: { value: Division; label: string; icon: typeof Palette }[] = [
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'developer', label: 'Developer', icon: Code2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const canSwitchDivision = isSuperAdmin;

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center justify-between gap-2.5 px-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Fix Note" className="w-7 h-7 rounded-lg shrink-0" />
          <span className="font-bold text-foreground text-sm">Fix Note</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {canSwitchDivision && (
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Division</p>
          <div className="space-y-0.5">
            {divisionOptions.map(opt => (
              <button key={opt.value} onClick={() => setActiveDivision(opt.value)}
                className={cn('w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-2.5 py-1.5',
                  activeDivision === opt.value ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}>
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
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => cn('flex items-center gap-2 rounded-lg text-sm transition-colors px-2.5 py-2',
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}>
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
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors px-2.5 py-1.5">
          <LogOut className="w-4 h-4 shrink-0" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40 shadow-sm">
        <button onClick={() => setMobileOpen(true)} className="p-1.5 text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <img src={logoImg} alt="Fix Note" className="w-6 h-6 rounded-md" />
          <span className="font-bold text-foreground text-sm">Fix Note</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 bottom-0 left-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50 w-52 transition-transform duration-300',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
