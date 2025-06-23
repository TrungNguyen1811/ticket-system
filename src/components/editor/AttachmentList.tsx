import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ImageIcon, FileText, Download, Trash, Paperclip } from "lucide-react";
import { formatDate } from "@/lib/utils";
import React from "react";

export interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  isLoading?: boolean;
  isError?: boolean;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  downloadingFiles?: Set<string>;
  deletingFiles?: Set<string>;
  isTicketComplete?: boolean;
}

export function AttachmentList({
  attachments,
  isLoading,
  isError,
  onDownload,
  onDelete,
  downloadingFiles = new Set(),
  deletingFiles = new Set(),
  isTicketComplete,
}: AttachmentListProps) {
  const [search, setSearch] = React.useState("");

  const filtered = attachments.filter(a =>
    a.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="text-lg font-medium">Attachments</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search attachments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="space-y-2 max-h-[calc(100vh-535px)] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="text-center p-4 text-red-500">
              Failed to load attachments
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-2">
              {filtered.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className="flex-shrink-0">
                      {attachment.content_type.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {/* <a
                        href={attachment.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        
                      </a> */}
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">{attachment.file_name}</p>
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {attachment.file_size} • {formatDate(attachment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {onDownload && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDownload(attachment.id);
                        }}
                        disabled={downloadingFiles.has(attachment.id)}
                        className="h-8 w-8 p-0"
                      >
                        {downloadingFiles.has(attachment.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(attachment.id);
                        }}
                        disabled={deletingFiles.has(attachment.id) || isTicketComplete}
                        className="h-8 w-8 p-0 hover:text-red-500"
                      >
                        {deletingFiles.has(attachment.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg bg-gray-50/50">
              <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No attachments found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}