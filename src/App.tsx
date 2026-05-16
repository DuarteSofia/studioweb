import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { seedData } from '@/store';
import LandingPage from '@/pages/LandingPage';
import HomePage from '@/pages/HomePage';
import DesignPage from '@/pages/DesignPage';
import AdminPage from '@/pages/admin/AdminPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDesigns from '@/pages/admin/AdminDesigns';
import AdminNiches from '@/pages/admin/AdminNiches';
import AdminConfig from '@/pages/admin/AdminConfig';
import AuthGuard from '@/components/AuthGuard';

export default function App() {
  useEffect(() => {
    seedData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/diseños" element={<HomePage />} />
        <Route path="/design/:slug" element={<DesignPage />} />
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<AdminDesigns />} />
          <Route path="niches" element={<AdminNiches />} />
          <Route path="config" element={<AdminConfig />} />
        </Route>
        <Route path="/login" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
