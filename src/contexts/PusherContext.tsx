import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
  } from "react";
  import Pusher from "pusher-js";
  import { useAuth } from "./AuthContext";
  
  const PUSHER_CONFIG = {
    key: import.meta.env.VITE_PUSHER_KEY,
    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  };
  
  const RETRY_CONFIG = {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
  };
  
  type PusherContextType = {
    pusher: Pusher | null;
    isConnected: boolean;
    retryCount: number;
  };
  
  const PusherContext = createContext<PusherContextType | undefined>(undefined);
  
  export function PusherProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pusherRef = useRef<Pusher | null>(null);
    const isInitializedRef = useRef(false);
  
    const clearRetryTimeout = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  
    const calculateBackoffDelay = (retry: number) => {
      const baseDelay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retry);
      return Math.min(baseDelay, RETRY_CONFIG.maxDelay) + Math.random() * 1000; // jitter
    };
  
    const cleanupPusher = useCallback(() => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setPusher(null);
      setIsConnected(false);
      clearRetryTimeout();
      setRetryCount(0);
    }, []);
  
    const initializePusher = useCallback(() => {
      // Prevent multiple initializations
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;
  
      clearRetryTimeout();
  
      if (pusherRef.current) {
        cleanupPusher();
      }
  
      const client = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
        authEndpoint: `${import.meta.env.VITE_API_URL}/api/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
        enabledTransports: ['ws', 'wss'],
        disabledTransports: ['xhr_streaming', 'xhr_polling'],
        forceTLS: true,
        activityTimeout: 30000,
        pongTimeout: 15000,
      });
  
      pusherRef.current = client;
      setPusher(client);
  
      client.connection.bind("connected", () => {
        console.log("✅ Pusher connected");
        setIsConnected(true);
        setRetryCount(0);
      });
  
      const handleDisconnect = () => {
        console.warn("⚠️ Pusher disconnected");
        setIsConnected(false);
        scheduleReconnect();
      };
  
      client.connection.bind("disconnected", handleDisconnect);
      client.connection.bind("error", (err: any) => {
        console.error("❌ Pusher error:", err);
        setIsConnected(false);
        scheduleReconnect();
      });
  
      client.connection.bind('state_change', (states: any) => {
        console.log(`Pusher connection state changed from ${states.previous} to ${states.current}`);
      });
    }, [cleanupPusher]);
  
    const scheduleReconnect = useCallback(() => {
      if (retryCount >= RETRY_CONFIG.maxRetries) {
        console.error("❌ Max retries reached");
        return;
      }
  
      const delay = calculateBackoffDelay(retryCount);
      console.log(`🔁 Reconnecting in ${delay.toFixed(0)}ms`);
  
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, delay);
    }, [retryCount]);
  
    // Handle authentication state changes
    useEffect(() => {
      if (!isAuthenticated) {
        cleanupPusher();
        isInitializedRef.current = false;
        return;
      }
  
      if (!isInitializedRef.current) {
        initializePusher();
      }
  
      return () => {
        cleanupPusher();
        isInitializedRef.current = false;
      };
    }, [isAuthenticated, initializePusher, cleanupPusher]);
  
    // Retry logic
    useEffect(() => {
      if (retryCount > 0 && retryCount <= RETRY_CONFIG.maxRetries && isAuthenticated) {
        initializePusher();
      }
    }, [retryCount, initializePusher, isAuthenticated]);
  
    return (
      <PusherContext.Provider value={{ pusher, isConnected, retryCount }}>
        {children}
      </PusherContext.Provider>
    );
  }
  
  export const usePusher = (): PusherContextType => {
    const context = useContext(PusherContext);
    if (!context) {
      throw new Error("usePusher must be used within a PusherProvider");
    }
    return context;
  };
  