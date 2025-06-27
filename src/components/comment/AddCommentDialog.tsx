// "use client";

// import type React from "react";

// import { useState, useRef, useCallback, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/components/ui/use-toast";
// import { Paperclip, X, FileText, ImageIcon, File, Loader2 } from "lucide-react";
// import { LexicalComposer } from "@lexical/react/LexicalComposer";
// import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
// import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
// import { ListPlugin } from "@lexical/react/LexicalListPlugin";
// import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
// import { TRANSFORMERS } from "@lexical/markdown";
// import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
// import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// import { $getRoot, EditorState } from "lexical";
// import { HeadingNode, QuoteNode } from "@lexical/rich-text";
// import { ListItemNode, ListNode } from "@lexical/list";
// import { AutoLinkNode, LinkNode } from "@lexical/link";
// import { CodeNode, CodeHighlightNode } from "@lexical/code";
// import { $generateHtmlFromNodes } from "@lexical/html";
// import configTheme from "../theme/configTheme";
// import { createEditor } from "lexical";

// interface AddCommentDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSubmit: (data: {
//     editorContent: { raw: string; html: string };
//     attachments?: File[];
//   }) => void;
//   ticketId?: string;
//   isComplete?: boolean;
// }

// // Editor configuration
// export const initialConfig = {
//   namespace: "AddCommentDialogEditor",
//   theme: configTheme,
//   onError: (error: Error) => {
//     console.error("Editor error:", error);
//   },
//   nodes: [
//     HeadingNode,
//     ListNode,
//     ListItemNode,
//     CodeNode,
//     CodeHighlightNode,
//     AutoLinkNode,
//     LinkNode
//   ],
// };

// export function AddCommentDialog({
//   open,
//   onOpenChange,
//   onSubmit,
//   ticketId,
//   isComplete,
// }: AddCommentDialogProps) {
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [editorContent, setEditorContent] = useState<{
//     raw: string;
//     html: string;
//     text: string;
//   }>({
//     raw: "",
//     html: "",
//     text: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const dropZoneRef = useRef<HTMLDivElement>(null);
//   const { toast } = useToast();

//   // Generate unique key for this dialog instance
//   const uniqueKey = `AddCommentDialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       const newFiles = Array.from(e.target.files);
//       setAttachments((prev) => [...prev, ...newFiles]);
//     }
//   };

//   const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (dropZoneRef.current) {
//       dropZoneRef.current.classList.add("bg-blue-50", "border-blue-300");
//     }
//   }, []);

//   const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (dropZoneRef.current) {
//       dropZoneRef.current.classList.remove("bg-blue-50", "border-blue-300");
//     }
//   }, []);

//   const handleDrop = useCallback(
//     (e: React.DragEvent<HTMLDivElement>) => {
//       e.preventDefault();
//       e.stopPropagation();

//       if (dropZoneRef.current) {
//         dropZoneRef.current.classList.remove("bg-blue-50", "border-blue-300");
//       }

//       if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//         const newFiles = Array.from(e.dataTransfer.files);
//         setAttachments((prev) => [...prev, ...newFiles]);

//         toast({
//           title: "Files added",
//           description: `${newFiles.length} file(s) added successfully.`,
//         });
//       }
//     },
//     [toast],
//   );

//   const removeAttachment = (index: number) => {
//     setAttachments(attachments.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       await onSubmit({
//         editorContent: {
//           raw: editorContent.raw,
//           html: editorContent.html,
//         },
//         attachments,
//       });
//       onOpenChange(false);
//       setLoading(false);
//       setEditorContent({ raw: "", html: "", text: "" });
//       setAttachments([]);
//     } catch (error) {
//       setLoading(false);
//       toast({
//         title: "Error",
//         description: "Failed to add comment",
//         variant: "destructive",
//       });
//     }
//   };

//   const getFileIcon = (file: File) => {
//     const fileType = file.type.split("/")[0];
//     switch (fileType) {
//       case "image":
//         return <ImageIcon className="h-5 w-5 text-blue-500" />;
//       case "text":
//         return <FileText className="h-5 w-5 text-green-500" />;
//       default:
//         return <File className="h-5 w-5 text-gray-500" />;
//     }
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return (
//       Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
//     );
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
//         <DialogHeader>
//           <DialogTitle>Add Comment</DialogTitle>
//         </DialogHeader>
//         <form
//           onSubmit={handleSubmit}
//           className="space-y-4 flex-1 overflow-auto "
//         >
//           <div className="space-y-2 m-4">
//             <Label htmlFor="content">Comment *</Label>
//             <LexicalComposer key={uniqueKey} initialConfig={initialConfig}>
//               <div className="relative">
//                 <ToolbarPlugin />
//                 <div className="relative mt-2">
//                   <RichTextPlugin
//                     contentEditable={
//                       <ContentEditable className="outline-none focus:ring-0 focus:ring-offset-0" />
//                     }
//                     placeholder={
//                       <div className="absolute top-4 left-4 text-gray-400">
//                         Enter your comment here...
//                       </div>
//                     }
//                     ErrorBoundary={LexicalErrorBoundary}
//                   />
//                 </div>
//                 <HistoryPlugin />
//                 <AutoFocusPlugin />
//                 <LinkPlugin />
//                 <ListPlugin />
//                 <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
//                 <OnChangePlugin onChange={setEditorContent} />
//               </div>
//             </LexicalComposer>
//           </div>

//           <div className="space-y-2 m-4">
//             <Label htmlFor="attachments">Attachments</Label>
//             <div
//               ref={dropZoneRef}
//               className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors duration-200 ease-in-out"
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//               onDrop={handleDrop}
//             >
//               <div className="text-center">
//                 <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
//                 <div className="mt-4">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => fileInputRef.current?.click()}
//                     className="mx-auto"
//                   >
//                     <Paperclip className="h-4 w-4 mr-2" />
//                     Select Files
//                   </Button>
//                   <input
//                     ref={fileInputRef}
//                     id="attachments"
//                     type="file"
//                     multiple
//                     onChange={handleFileChange}
//                     className="hidden"
//                   />
//                   <p className="mt-2 text-sm text-gray-500">
//                     or drag and drop files here
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {attachments.length > 0 && (
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label>Selected files ({attachments.length})</Label>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setAttachments([])}
//                     className="text-xs h-7 px-2"
//                   >
//                     Clear all
//                   </Button>
//                 </div>
//                 <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
//                   {attachments.map((file, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
//                     >
//                       <div className="flex items-center space-x-3 overflow-hidden">
//                         {getFileIcon(file)}
//                         <div className="overflow-hidden">
//                           <p className="text-sm font-medium text-gray-900 truncate">
//                             {file.name}
//                           </p>
//                           <p className="text-xs text-gray-500">
//                             {formatFileSize(file.size)}
//                           </p>
//                         </div>
//                       </div>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => removeAttachment(index)}
//                         className="h-7 w-7 p-0 rounded-full"
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           <DialogFooter className="pt-4 mx-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={loading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={loading || !editorContent.text.trim() || isComplete}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Adding...
//                 </>
//               ) : (
//                 "Add Comment"
//               )}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // Custom plugin to get editor content as plain text

