import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Attachment } from "@/types/ticket";
import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import attachmentService from "@/services/attachment.service";

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

    if (!attachment) return null;

    const isImage = attachment.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
    const isPdf = attachment.file_name.toLowerCase().endsWith('.pdf');

    // Fetch attachment URL when modal opens
    useEffect(() => {
      if (isOpen && attachment) {
        setIsLoading(true);
        setError("");
        
        attachmentService.getAttachment(attachment.id)
          .then(response => {
            const attachmentData = response.data;
            setAttachmentUrl(`${import.meta.env.VITE_API_URL}${attachmentData.file_path}`);
          })
          .catch(err => {
            console.error('Failed to fetch attachment URL:', err);
            setError("Failed to load attachment");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }, [isOpen, attachment]);

    // Reset state when modal closes
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
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center justify-between">
              <span className="truncate">{attachment.file_name}</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
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
                  target.src = '/placeholder-image.png';
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
        </DialogContent>
      </Dialog>
    );
  };