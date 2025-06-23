"use client";

import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Ticket } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { login, isLoading, isAuthenticated } = useAuth();
  const { loginWithRedirect } = useAuth0();
  const { toast } = useToast();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Handle redirect after successful login
  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
    }
  }, [isAuthenticated, isRedirecting]);

  // Redirect if already authenticated
  if (isAuthenticated && isRedirecting) {
    return <Navigate to={from} replace />;
  }

  const handleSlackLogin = async () => {
    try {
      await loginWithRedirect({
        connection: "slack",
        appState: { returnTo: from },
      } as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      toast({
        title: "Error",
        description: "Failed to login with Slack",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Ticket className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              TasketES
            </h1>
            <p className="text-gray-600 text-lg">
              Your Ticket Management Solution
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center font-bold text-gray-800">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in with your Slack account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-2"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-sm h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                onClick={handleSlackLogin}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src="src/assets/Slack_icon.svg"
                    alt="Slack Logo"
                    className="h-6 w-6"
                  />
                  <span className="text-gray-700 font-semibold text-lg">
                    {isLoading ? "Connecting..." : "Continue with Slack"}
                  </span>
                </div>
              </Button>

              <p className="text-sm text-gray-500 text-center max-w-sm">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Need help? Contact your administrator
          </p>
          <p className="text-xs text-gray-400">
            © 2025 TasketES. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
