import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FolderKanban, LogOut, Palette, Code2,
  Building2, ListTodo, Users, Menu, X, PlusCircle, Moon, Sun, StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division } from '@/types';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import logoImg from '@/assets/logo.png';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import AvatarUpload from '@/components/AvatarUpload';

const Sidebar = () => {
  const { user, logout, activeDivision, setActiveDivision, isSuperAdmin, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePosition, setProfilePosition] = useState('');
  const [saving, setSaving] = useState(false);
  const updateProfile = useUpdateProfile();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user && profileOpen) {
      setProfileName(user.name);
      setProfilePosition(user.position || '');
    }
  }, [profileOpen, user]);

  if (!user) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/notepad', icon: StickyNote, label: 'Notepad' },
    ...(isAdmin ? [
      { to: '/company', icon: Building2, label: 'Company' },
      { to: '/members', icon: Users, label: 'Members' },
    ] : []),
    ...(isSuperAdmin && !user.company_id ? [
      { to: '/register-company', icon: PlusCircle, label: 'Register Company' },
    ] : []),
  ];

  const divisionOptions: { value: Division; label: string; icon: typeof Palette }[] = [
    ...(isSuperAdmin ? [{ value: 'management' as Division, label: 'Management', icon: Building2 }] : []),
    { value: 'creative', label: 'Creative', icon: Palette },
    { value: 'developer', label: 'Developer', icon: Code2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ id: user.id, name: profileName.trim(), position: profilePosition.trim() || undefined });
      await refreshProfile();
      setProfileOpen(false);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const canSwitchDivision = isSuperAdmin;
  const isDark = theme === 'dark';

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

      {/* Dark mode toggle */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between px-2.5 py-2">
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
            {isDark ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
            <span>{isDark ? 'Dark' : 'Light'}</span>
          </div>
          <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} className="scale-90" />
        </div>
      </div>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button onClick={() => setProfileOpen(true)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer text-left">
          <AvatarUpload userId={user.id} currentAvatar={user.avatar} name={user.name} size="sm" editable={false} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role}</p>
          </div>
        </button>
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

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your name and position.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2">
            <AvatarUpload userId={user.id} currentAvatar={user.avatar} name={profileName} size="lg" onUploaded={async () => { await refreshProfile(); }} />
            <div className="w-full space-y-3">
              <div>
                <Label htmlFor="profile-name" className="text-xs">Name</Label>
                <Input id="profile-name" value={profileName} onChange={e => setProfileName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="profile-position" className="text-xs">Position</Label>
                <Input id="profile-position" value={profilePosition} onChange={e => setProfilePosition(e.target.value)} placeholder="e.g. Designer, Developer" className="mt-1" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving || !profileName.trim()} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
