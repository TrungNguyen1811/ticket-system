"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Paperclip, X, FileText, ImageIcon, File, Loader2 } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $getRoot, EditorState, ParagraphNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { $generateHtmlFromNodes } from "@lexical/html";
import configTheme from "../theme/configTheme";
import { createEditor } from "lexical";
import { OnChangePlugin } from "../editor/OnChangePlugin";
import PlaygroundAutoLinkPlugin from "../editor/AutoLinkPlugin";
import ListMaxIndentLevelPlugin from "../editor/ListMaxIndentLevelPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import InlineImagePlugin from "../editor/InlineImagePlugin";
import { ClearEditorPlugin } from "../editor/ClearEditorPlugin";
import { ImageNode } from "../editor/InlineImageNodes";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

interface AddCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    editorContent: { raw: string; html: string };
    attachments?: File[];
  }) => void;
  ticketId: string;
  isComplete?: boolean;
}

// Editor configuration
const initialConfig = {
  namespace: "ConversationInputEditor",
  onError: (error: Error) => { console.error(error); },
  theme: configTheme,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    ParagraphNode,
    TableNode, TableCellNode, TableRowNode,
    ImageNode,
  ],
};

export function AddCommentDialog({
  open,
  onOpenChange,
  onSubmit,
  ticketId,
  isComplete,
}: AddCommentDialogProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editorContent, setEditorContent] = useState<{
    raw: string;
    html: string;
    text: string;
  }>({
    raw: "",
    html: "",
    text: "",
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Generate unique key for this dialog instance
  const uniqueKey = `AddCommentDialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("bg-blue-50", "border-blue-300");
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("bg-blue-50", "border-blue-300");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove("bg-blue-50", "border-blue-300");
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files);
        setAttachments((prev) => [...prev, ...newFiles]);

        toast({
          title: "Files added",
          description: `${newFiles.length} file(s) added successfully.`,
        });
      }
    },
    [toast],
  );

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        editorContent: {
          raw: editorContent.raw,
          html: editorContent.html,
        },
        attachments,
      });
      onOpenChange(false);
      setLoading(false);
      setEditorContent({ raw: "", html: "", text: "" });
      setAttachments([]);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (file: File) => {
    const fileType = file.type.split("/")[0];
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case "text":
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[1000px] md:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex-1 overflow-auto "
        >
          <div className="space-y-2 m-4">
            <Label htmlFor="content">Comment *</Label>
            <LexicalComposer initialConfig={initialConfig}>
              <div className="relative">
                <ToolbarPlugin ticketId={ticketId} />
                <div
                  className="relative border p-2 min-h-[40vh]"
                  onClick={() => contentEditableRef.current?.focus()}
                  style={{ cursor: "text" }}
                >
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        ref={contentEditableRef}
                        className="outline-none focus:ring-0 focus:ring-offset-0"
                      />
                    }
                    placeholder={
                      <div className="absolute top-2 left-2 text-gray-400 pointer-events-none">
                        Enter your comment here...
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </div>
                  <ListPlugin />
                  <LinkPlugin />
                  <PlaygroundAutoLinkPlugin />
                  <ListMaxIndentLevelPlugin maxDepth={7} />
                  <HistoryPlugin />
                  <AutoFocusPlugin />
                  <TablePlugin />
                  <OnChangePlugin onChange={setEditorContent} />
                  <InlineImagePlugin />
              </div>
            </LexicalComposer>
          </div>

          <div className="space-y-2 m-4">
            <Label htmlFor="attachments">Attachments</Label>
            <label
              htmlFor="attachments"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-50 hover:border-blue-300 relative min-h-[120px] flex flex-col items-center justify-center"
              tabIndex={0}
              onDragOver={handleDragOver as any}
              onDragLeave={handleDragLeave as any}
              onDrop={handleDrop as any}
              aria-label="File upload area. Click or drag files here."
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
            >
              <input
                ref={fileInputRef}
                id="attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                tabIndex={-1}
              />
              {attachments.length === 0 && (
                <>
                  <Paperclip className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-gray-500 text-sm">Click or drag files here to upload</span>
                </>
              )}
              {attachments.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{attachments.length} file(s) selected</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachments([])}
                      className="text-xs h-7 px-2"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className={attachments.some(f => f.type.startsWith('image/')) ? 'grid grid-cols-2 gap-2 max-h-40 overflow-y-auto' : 'flex flex-col gap-2 max-h-40 overflow-y-auto'}>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 rounded-md hover:bg-gray-100 transition-colors p-2 relative group"
                      >
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-12 w-12 object-cover rounded mr-3 border"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500 truncate">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={e => { e.stopPropagation(); removeAttachment(index); }}
                          className="h-7 w-7 p-0 rounded-full ml-2 opacity-70 group-hover:opacity-100"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-2 m-4 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}