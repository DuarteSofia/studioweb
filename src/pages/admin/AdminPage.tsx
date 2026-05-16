import { useState, useCallback } from 'react';
import { isAuthenticated } from '@/store';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';

export default function AdminPage() {
  const [authed, setAuthed] = useState(isAuthenticated());

  const handleSuccess = useCallback(() => {
    setAuthed(true);
  }, []);

  if (!authed) {
    return <AdminLogin onSuccess={handleSuccess} />;
  }

  return <AdminLayout />;
}
