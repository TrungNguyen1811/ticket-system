import { useState, useEffect } from "react";
import { Mail } from "@/types/mail";
import { isImageFileByName } from "./useConversationUtils";

export const useOptimisticUpdates = () => {
  const [optimisticObjectUrls, setOptimisticObjectUrls] = useState<Set<string>>(new Set());

  const createOptimisticMail = (
    user: any,
    ticketData: any,
    emailHtml: string,
    selectedFiles: File[]
  ): Mail => {
    // Create object URLs for images and track them
    const objectUrls: string[] = [];
    const optimisticAttachments = selectedFiles.map((file, index) => {
      const tempId = `temp-${Date.now()}-${index}`;
      const isImage = isImageFileByName(file.name);
      let objectUrl = "";

      if (isImage) {
        objectUrl = URL.createObjectURL(file);
        objectUrls.push(objectUrl);
      }

      return {
        id: tempId,
        file_name: file.name,
        file_path: objectUrl,
        file_type: file.type,
        file_size: file.size,
        file_extension: file.name.split(".").pop() || "",
        created_at: new Date().toISOString(),
      };
    });

    // Track object URLs for cleanup
    setOptimisticObjectUrls((prev) => new Set([...prev, ...objectUrls]));

    return {
      id: `temp-${Date.now()}`,
      from_name: user?.name || "",
      from_email: "phamphanbang@gmail.com",
      subject: `Re: ${ticketData?.title || ""}`,
      body: emailHtml,
      attachments: optimisticAttachments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const cleanupOptimisticUrls = (mailsData: Mail[]) => {
    if (mailsData && mailsData.length > 0) {
      // Check if there are any optimistic mails that have been replaced
      const hasOptimisticMails = mailsData.some((mail: Mail) =>
        mail.id.startsWith("temp-")
      );
      if (!hasOptimisticMails && optimisticObjectUrls.size > 0) {
        // All optimistic mails have been replaced, cleanup object URLs
        optimisticObjectUrls.forEach((url) => {
          URL.revokeObjectURL(url);
        });
        setOptimisticObjectUrls(new Set());
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke all tracked object URLs to prevent memory leaks
      optimisticObjectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [optimisticObjectUrls]);

  return {
    optimisticObjectUrls,
    createOptimisticMail,
    cleanupOptimisticUrls,
  };
}; 