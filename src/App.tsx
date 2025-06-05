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

function App() {
  return (
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
  )
}

export default App
