import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useSidebarCollapse } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { collapsed } = useSidebarCollapse();

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn('p-6 transition-all duration-300', collapsed ? 'ml-[68px]' : 'ml-60')}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
