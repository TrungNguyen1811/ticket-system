import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageTransition } from '@/components/ui/page-transition';
import { ThemeProvider } from './components/theme-provider';
import { PusherProvider } from '@/contexts/PusherContext';


// Create a component to use useRoutes hook
function AppRoutes() {
  const element = useRoutes(routes);
  return (
    <PageTransition>
      {element}
    </PageTransition>
  );
}

export default function App() {
  const queryClient = new QueryClient();

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >              
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PusherProvider>
                <AppRoutes />
                <Toaster />
            </PusherProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>                  
      </Router>
    </Auth0Provider>
  );
}
