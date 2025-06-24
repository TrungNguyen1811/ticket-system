import { Attachment } from "@/types/ticket";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, FileText, ImageIcon, Eye, Download } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import attachmentService from "@/services/attachment.service";

interface AttachmentsPanelProps {
    attachments: Attachment[];
    isLoading: boolean;
    isError: boolean;
    onDownload: (attachmentId: string) => void;
    downloadingFiles: Set<string>;
    onPreviewFile: (attachment: Attachment) => void;
  }
  
export const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({
    attachments,
    isLoading,
    isError,
    onDownload,
    downloadingFiles,
    onPreviewFile,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"files" | "media">("files");
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  
  
    const isImageFile = (ext: string) => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        return imageExtensions.includes(ext.toLowerCase());
    };
  
    const isPdfFile = (filename: string) => {
      return filename.toLowerCase().endsWith('.pdf');
    };
  
    const filteredAttachments = attachments.filter(attachment =>
      attachment.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fileAttachments = filteredAttachments.filter(attachment => 
      !isImageFile(attachment.file_extension)
    );


    const mediaAttachments = useMemo(
        () => filteredAttachments.filter((a) => isImageFile(a.file_extension)),
        [filteredAttachments]
      );

    // // Fetch attachment URLs for media files
    // useEffect(() => {
    //   const fetchAttachmentUrls = async () => {
    //     const mediaAttachmentsToFetch = useMemo(() => {
    //         return mediaAttachments.filter(
    //           attachment => !attachmentUrls[attachment.id] && !loadingUrls.has(attachment.id)
    //         );
    //       }, [mediaAttachments, attachmentUrls, loadingUrls]);
          
    //     console.log("mediaAttachmentsToFetch", mediaAttachmentsToFetch);
  
    //     if (mediaAttachmentsToFetch.length === 0) return;
  
    //     for (const attachment of mediaAttachmentsToFetch) {
    //       setLoadingUrls(prev => new Set(prev).add(attachment.id));
          
    //       try {
    //         const response = await attachmentService.getAttachment(attachment.id);
    //         const attachmentData = response.data;
            
    //         setAttachmentUrls(prev => ({
    //           ...prev,
    //           [attachment.id]: `${import.meta.env.VITE_API_URL}${attachmentData?.file_path}`
    //         }));
    //       } catch (error) {
    //         console.error(`Failed to fetch attachment URL for ${attachment.id}:`, error);
    //       } finally {
    //         setLoadingUrls(prev => {
    //           const newSet = new Set(prev);
    //           newSet.delete(attachment.id);
    //           return newSet;
    //         });
    //       }
    //     }
    //   };
  
    //   fetchAttachmentUrls();
    // }, [mediaAttachments]);
  
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
  
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      );
    }
  
    if (isError) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-4">
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Failed to load attachments</p>
            </div>
          </CardContent>
        </Card>
      );
    }
  
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Attachments</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3 w-3" />
            <Input
              placeholder="Search attachments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === "files"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("files")}
            >
              Files ({fileAttachments.length})
            </button>
            <button
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === "media"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("media")}
            >
              Media ({mediaAttachments.length})
            </button>
          </div>
  
          {/* Content */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activeTab === "files" ? (
              fileAttachments.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No files found</p>
                </div>
              ) : (
                fileAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {attachment.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(attachment.id)}
                      disabled={downloadingFiles.has(attachment.id)}
                      className="h-6 w-6 p-0"
                    >
                      {downloadingFiles.has(attachment.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))
              )
            ) : (
              mediaAttachments.length === 0 ? (
                <div className="text-center py-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No media found</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaAttachments.map((attachment) => {
                    const imageUrl = attachment.id;
                    const isLoading = loadingUrls.has(attachment.id);
  
                    return (
                      <div
                        key={attachment.id}
                        className="group relative aspect-square rounded-lg border overflow-hidden hover:border-primary transition-colors cursor-pointer"
                        onClick={() => onPreviewFile(attachment)}
                      >
                        {isLoading ? (
                          <div className="w-full h-full flex items-center justify-center bg-muted/30">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : imageUrl ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/attachments/${attachment.id}`}
                            alt={attachment.file_name}
                            className="w-full h-full object-cover"
                            // onError={(e) => {
                            //   // Fallback to default image or placeholder
                            //   const target = e.target as HTMLImageElement;
                            //   target.src = '/placeholder-image.png'; // You can add a placeholder image
                            // }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/30">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  };