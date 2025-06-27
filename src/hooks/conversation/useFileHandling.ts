import { useState, useCallback } from "react";
import { isImageFileByName } from "./useConversationUtils";

export const useFileHandling = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const getFilePreview = useCallback((file: File) => {
    if (isImageFileByName(file.name)) {
      return URL.createObjectURL(file);
    }
    return null;
  }, []);

  return {
    selectedFiles,
    handleFileSelect,
    handleRemoveFile,
    clearFiles,
    getFilePreview,
  };
}; 