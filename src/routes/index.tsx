import { lazy, Suspense } from "react";
import { Outlet, RouteObject } from "react-router-dom";
import {
  Ticket,
  MessageSquare,
  Users,
  Settings,
  Home,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Layout from "@/components/shared/Layout";
import ConversationTabsLayout from "@/components/shared/ConversationTabsLayout";

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

// Loading component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div className="relative">
      {/* Animated circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-ping" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-300 rounded-full animate-pulse" />
      </div>
      <div className="relative flex items-center justify-center w-16 h-16">
        <Ticket className="w-8 h-8 text-blue-500" />
      </div>
    </div>

    {/* Loading text with animation */}
    <div className="mt-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading</h2>
      <p className="text-gray-500">
        Please wait while we prepare your workspace
      </p>
    </div>

    {/* Loading indicators */}
    <div className="flex items-center gap-2 mt-8">
      <div
        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>

    {/* Feature icons */}
    <div className="flex items-center gap-8 mt-12">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Home className="w-6 h-6" />
        <span className="text-xs">Dashboard</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Ticket className="w-6 h-6" />
        <span className="text-xs">Tickets</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <MessageSquare className="w-6 h-6" />
        <span className="text-xs">Comments</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Users className="w-6 h-6" />
        <span className="text-xs">Users</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Settings className="w-6 h-6" />
        <span className="text-xs">Settings</span>
      </div>
    </div>
  </div>
);

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
            path: "conversation",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Conversation />
              </Suspense>
            ),
          },
          {
            path: "conversation/:id",
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
