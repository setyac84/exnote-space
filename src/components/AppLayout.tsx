import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="p-6 ml-48">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
