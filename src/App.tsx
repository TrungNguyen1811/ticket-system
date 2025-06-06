import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/shared/Layout"
import { Dashboard } from "@/pages/Dashboard"
import { Tickets } from "@/pages/Tickets"
import { TicketDetail } from "@/pages/TicketDetail"
import { Clients } from "@/pages/Clients"
import { Users } from "@/pages/Users"
import { Settings } from "@/pages/Settings"
import { Toaster } from "@/components/ui/toaster"
import "./App.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Login } from "@/pages/Login"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Auth0Provider } from "@auth0/auth0-react"

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain="dev-csrspneydoubsytr.jp.auth0.com"
        clientId="JPE3CUbaz7imTigrrtjGjkXABhvC5BKX"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://dev-csrspneydoubsytr.jp.auth0.com/api/v2/",
          scope: "openid profile email"
        }}
        cacheLocation="localstorage" //giữ session sau reload
        useRefreshTokens={true}
      >
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/tickets" element={<Tickets />} />
                        <Route path="/tickets/:id" element={<TicketDetail />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/users" element={<Users />} />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <Settings />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </Auth0Provider>
    </QueryClientProvider>
  )
}

export default App
