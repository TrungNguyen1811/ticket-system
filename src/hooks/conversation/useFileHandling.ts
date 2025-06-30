import { useState, useCallback } from "react";
import { isImageFileByName } from "./useConversationUtils";

export const useFileHandling = (inlineImages: { file: File, url: string }[] = []) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  console.log("inline", inlineImages)
  console.log("select", selectedFiles)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files).filter(file => {
          // Không thêm nếu file đã có trong inlineImages
          return !inlineImages.some(img => img.file.name === file.name && img.file.size === file.size);
        });
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [inlineImages]
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