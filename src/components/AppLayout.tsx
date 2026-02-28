import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Top bar - desktop */}
      <div className="hidden lg:flex fixed top-0 left-52 right-0 h-14 items-center justify-center px-6 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <GlobalSearch />
      </div>
      {/* Top bar - mobile (below mobile header) */}
      <div className="lg:hidden px-4 pt-[60px] pb-2">
        <GlobalSearch />
      </div>
      <main className="p-4 pt-2 lg:pt-[72px] lg:pl-56 lg:pr-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
