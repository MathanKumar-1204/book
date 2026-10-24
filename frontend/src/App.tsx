import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AuthorLayout } from './layouts/AuthorLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { NotFound } from './pages/NotFound';
import { Unauthorized } from './pages/Unauthorized';

// Author Pages
import { AuthorDashboard } from './pages/author/AuthorDashboard';
import { MyBooks } from './pages/author/MyBooks';
import { BookDetail } from './pages/author/BookDetail';
import { SubmitTicket } from './pages/author/SubmitTicket';
import { MyTickets } from './pages/author/MyTickets';
import { AuthorTicketDetail } from './pages/author/AuthorTicketDetail';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { GlobalQueue } from './pages/admin/GlobalQueue';
import { AdminTicketDetail } from './pages/admin/AdminTicketDetail';
import { AuthorCatalog } from './pages/admin/AuthorCatalog';

// Root Index Redirector based on verified role
const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/author/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Author Routes */}
          <Route element={<ProtectedRoute allowedRoles={['author', 'admin']} />}>
            <Route path="/author" element={<AuthorLayout />}>
              <Route index element={<Navigate to="/author/dashboard" replace />} />
              <Route path="dashboard" element={<AuthorDashboard />} />
              <Route path="books" element={<MyBooks />} />
              <Route path="books/:bookId" element={<BookDetail />} />
              <Route path="tickets" element={<MyTickets />} />
              <Route path="tickets/new" element={<SubmitTicket />} />
              <Route path="tickets/:ticketId" element={<AuthorTicketDetail />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="tickets" element={<GlobalQueue />} />
              <Route path="tickets/:ticketId" element={<AdminTicketDetail />} />
              <Route path="authors" element={<AuthorCatalog />} />
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
