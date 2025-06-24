import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Attachment } from "@/types/ticket";
import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    attachment: Attachment | null;
  }
  
  export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    isOpen,
    onClose,
    attachment,
  }) => {
    const [attachmentUrl, setAttachmentUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
  
    const isImage = attachment?.file_extension?.toLowerCase().match(/(jpg|jpeg|png|gif|bmp|webp)$/);
    const isPdf = attachment?.file_extension?.toLowerCase().match(/(pdf)$/);
  
    // Fetch URL
    useEffect(() => {
      if (isOpen && attachment) {
        setIsLoading(true);
        setError("");
        setAttachmentUrl(`${import.meta.env.VITE_API_URL}/attachments/${attachment.id}`);
        setIsLoading(false);
      }
    }, [isOpen, attachment]);
  
    // Reset when closing
    useEffect(() => {
      if (!isOpen) {
        setAttachmentUrl("");
        setError("");
        setIsLoading(false);
      }
    }, [isOpen]);
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {attachment ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="truncate">{attachment.file_name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                ) : isImage ? (
                  <img
                    src={attachmentUrl}
                    alt={attachment.file_name}
                    className="w-full h-auto max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.png";
                    }}
                  />
                ) : isPdf ? (
                  <iframe
                    src={attachmentUrl}
                    className="w-full h-[70vh] border-0"
                    title={attachment.file_name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  };
  