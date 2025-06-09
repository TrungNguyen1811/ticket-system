"use client"

import { useState } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Ticket, AlertCircle, Slack } from "lucide-react"
import { LoginSchema, loginSchema } from "@/schema/auth.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Separator } from "@/components/ui/separator"
import { useAuth0 } from "@auth0/auth0-react"

export default function Login() {
  const form = useForm<LoginSchema>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { login, isLoading, isAuthenticated } = useAuth()
  const { loginWithRedirect } = useAuth0()
  const { toast } = useToast()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/"

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: any) => {
    setError("")

    try {
      await login()
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    }
  }

  const handleSlackLogin = async () => {
    try {
      await loginWithRedirect({
        connection: "slack",
        appState: { returnTo: from }
      } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      toast({
        title: "Error",
        description: "Failed to login with Slack",
        variant: "destructive",
      })
    }
  }

  // const fillDemoCredentials = (role: "admin" | "manager" | "staff") => {
  //   const demoCredentials = {
  //     admin: { email: "admin@example.com", password: "admin123" },
  //     manager: { email: "manager@example.com", password: "manager123" },
  //     staff: { email: "staff@example.com", password: "staff123" },
  //   }
  //   setCredentials(demoCredentials[role])
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <Ticket className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TasketES</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...form.register("email")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...form.register("password")}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isValid}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <Separator />

            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="sm:w-56 sm:h-11 md:w-64 md:h-12" 
                onClick={handleSlackLogin}
                disabled={isLoading}
              >
                <img src="src/assets/Slack_icon.svg" alt="Slack Logo" className="sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <p className="sm:text-sm md:text-md ml-4 Lato font-bold">
                  {isLoading ? "Signing in..." : "Sign in with Slack"}
                </p>
              </Button>
            </div>
            {/* Demo Credentials
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 text-center mb-3">Demo Accounts:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("admin")}
                  className="text-xs"
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("manager")}
                  className="text-xs"
                >
                  Manager
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("staff")}
                  className="text-xs"
                >
                  Staff
                </Button>
              </div>
            </div> */}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 TasketES. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
