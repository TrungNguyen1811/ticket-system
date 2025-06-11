import { useEffect, useCallback, useRef, useState } from "react";
import { usePusher } from "@/contexts/PusherContext";
import { Channel } from "pusher-js";
  
type EventCallback = (data: any) => void;

export function usePusherSubscription(
  channelName: string,
  eventName: string,
  callback: EventCallback
) {
  const { pusher, isConnected } = usePusher();
  const callbackRef = useRef<EventCallback>(callback);
  const [channel, setChannel] = useState<Channel | null>(null);
  // Always use latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stableCallback = useCallback((data: any) => {
    callbackRef.current(data);
  }, []);

  useEffect(() => {
    if (!pusher || !isConnected || !channelName) {
      console.warn("🔕 Cannot bind: invalid state", { pusher, isConnected, channelName });
      return;
    }

    const channel = pusher.subscribe(channelName);
    setChannel(channel);
    channel.bind(eventName, stableCallback);
    console.log(`📡 Subscribed to ${channelName}:${eventName}`);

    return () => {
      channel.unbind(eventName, stableCallback);
      pusher.unsubscribe(channelName);
      console.log(`❌ Unsubscribed from ${channelName}:${eventName}`);
    };
  }, [pusher, isConnected, channelName, eventName, stableCallback]);

  return { isConnected, pusher, channel };
}
