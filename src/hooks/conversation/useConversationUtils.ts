import { useCallback } from "react";

// Utility functions
export const isImageFile = (ext: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  return imageExtensions.includes(ext.toLowerCase());
};

export const isImageFileByName = (name: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  return imageExtensions.includes(name.toLowerCase().split(".").pop() || "");
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const scrollToBottom = (container: HTMLDivElement | null) => {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};

const getScrollContainer = (scrollRef: React.RefObject<HTMLDivElement>): HTMLDivElement | null => {
  return scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
};

// Custom hook for scroll management
export const useScrollToBottom = (scrollRef: React.RefObject<HTMLDivElement>) => {
  const scrollToBottomWithDelay = useCallback((delay: number = 100) => {
    setTimeout(() => {
      const container = getScrollContainer(scrollRef);
      scrollToBottom(container);
    }, delay);
  }, [scrollRef]);

  const scrollToBottomImmediate = useCallback(() => {
    const container = getScrollContainer(scrollRef);
    scrollToBottom(container);
  }, [scrollRef]);

  return { scrollToBottomWithDelay, scrollToBottomImmediate };
}; 