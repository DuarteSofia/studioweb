import { useState, useCallback, type ReactNode } from 'react';
import { isAuthenticated } from '@/store';
import AdminLogin from '@/pages/admin/AdminLogin';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authed, setAuthed] = useState(isAuthenticated());

  const handleSuccess = useCallback(() => {
    setAuthed(true);
  }, []);

  if (!authed) {
    return <AdminLogin onSuccess={handleSuccess} />;
  }

  return <>{children}</>;
}
