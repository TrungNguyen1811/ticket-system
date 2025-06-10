import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
  } from "react";
  import Pusher from "pusher-js";
  
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
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pusherRef = useRef<Pusher | null>(null);
  
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
  
    const initializePusher = useCallback(() => {
      clearRetryTimeout();
  
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
  
      const client = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
        enabledTransports: ["ws", "wss"],
        activityTimeout: 30000,
        pongTimeout: 5000,
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
    }, []);
  
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
  
    // Initial connect
    useEffect(() => {
      initializePusher();
      return () => {
        clearRetryTimeout();
        pusherRef.current?.disconnect();
      };
    }, [initializePusher]);
  
    // Retry logic
    useEffect(() => {
      if (retryCount > 0 && retryCount <= RETRY_CONFIG.maxRetries) {
        initializePusher();
      }
    }, [retryCount, initializePusher]);
  
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
  