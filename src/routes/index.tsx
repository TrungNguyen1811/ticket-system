import { lazy, Suspense } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/shared/Layout';

// Lazy load components
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Tickets = lazy(() => import('@/pages/Tickets'));
const TicketDetail = lazy(() => import('@/pages/TicketDetail'));
const Clients = lazy(() => import('@/pages/Clients'));
const Users = lazy(() => import('@/pages/Users'));
const Settings = lazy(() => import('@/pages/Settings'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Route configuration
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <Outlet />
        </Layout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'tickets',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Tickets />
              </Suspense>
            ),
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <TicketDetail />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'clients',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Clients />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Users />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LoadingFallback />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
]; 