import { lazy, Suspense } from "react";
import { Outlet, RouteObject } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Layout from "@/components/shared/Layout";
import ConversationTabsLayout from "@/components/shared/ConversationTabsLayout";
import LoadingFallback from "@/components/LoadingFallback";

// Lazy load components
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Tickets = lazy(() => import("@/pages/Tickets"));
const TicketDetail = lazy(() => import("@/pages/TicketDetail"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const UsersPage = lazy(() => import("@/pages/Users"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const Conversation = lazy(() => import("@/pages/Conversation"));
const ConversationDetail = lazy(() => import("@/pages/ConversationDetail"));

// Route configuration
export const routes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/",
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
        path: "tickets",
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
            path: ":id",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <TicketDetail />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "users",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UsersPage />
          </Suspense>
        ),
      },
      {
        path: "communication",
        element: (
          <ConversationTabsLayout>
            <Outlet />
          </ConversationTabsLayout>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Conversation />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <ConversationDetail />
              </Suspense>
            ),
          },
          {
            path: "clients",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Clients />
              </Suspense>
            ),
          },
          {
            path: "clients/:id",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <ClientDetail />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
];
