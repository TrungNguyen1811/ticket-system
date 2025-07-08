import { X, ArrowLeft, ArrowRight, Download, FileText } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Attachment } from "@/types/ticket";

const PDF_EXTS = ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

function canPreviewPdf(ext: string) {
  return PDF_EXTS.includes(ext.toLowerCase());
}

function isImage(ext: string) {
  return IMAGE_EXTS.includes(ext.toLowerCase());
}

interface FilePreviewOverlayProps {
  files: Attachment[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
}

export function FilePreviewModal({
  files = [],
  open,
  initialIndex = 0,
  onClose,
}: FilePreviewOverlayProps) {
  const clampIndex = (idx: number) =>
    files.length === 0 ? 0 : Math.max(0, Math.min(idx, files.length - 1));

  const [current, setCurrent] = useState(() => clampIndex(initialIndex));
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const file = files[current];
  const ext = file?.file_extension?.toLowerCase() || "";
  const canPdf = canPreviewPdf(ext);
  const isImg = isImage(ext);

  const fileUrl = `${import.meta.env.VITE_API_URL}/attachments/${file?.id}`;

  // Reset state when modal opens
  useEffect(() => {
    setCurrent(clampIndex(initialIndex));
    setNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
  }, [open, files.length, initialIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || files.length === 0) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
    },
    [open, files.length],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  function prev() {
    setNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
    setCurrent((c) => (c > 0 ? c - 1 : files.length - 1));
  }

  function next() {
    setNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
    setCurrent((c) => (c < files.length - 1 ? c + 1 : 0));
  }

  // Only open new tab if PDF is valid but has too many pages
  useEffect(() => {
    if (!open || !canPdf || autoOpened || !file || numPages === null) return;

    if (numPages > 5) {
      window.open(fileUrl, "_blank");
      setAutoOpened(true);
      setTimeout(onClose, 300);
    }
  }, [open, canPdf, numPages, autoOpened, file]);

  // Handle error separately
  useEffect(() => {
    if (!open || !canPdf || autoOpened || !file || !pdfError) return;

    window.open(fileUrl, "_blank");
    setAutoOpened(true);
    setTimeout(onClose, 300);
  }, [open, canPdf, pdfError, autoOpened, file]);

  function handleDownload() {
    if (!file) return;
    const link = document.createElement("a");
    link.href = `${fileUrl}/download`;
    link.download = file.file_name;
    link.click();
  }

  if (!open) return null;
  if (!file) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
        <FileText className="w-8 h-8 mb-2" />
        No file to preview
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 transition-opacity duration-200 opacity-100",
      )}
      tabIndex={-1}
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next */}
      {files.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"
            onClick={prev}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"
            onClick={next}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Download */}
      <button
        className="absolute top-4 left-4 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"
        onClick={handleDownload}
      >
        <Download className="w-6 h-6" />
      </button>

      {/* File Content */}
      <div 
        className="w-full h-full flex items-center justify-center z-100"
      >
        {canPdf ? (
          <div className="bg-white rounded shadow max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-hidden"         
          onClick={(e) => e.stopPropagation()}>
            <iframe
              src={fileUrl}
              title={file.file_name}
              width="100%"
              height="100%"
              className="border-none"
            />
            <button
              className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded hover:bg-black/80 transition"
              onClick={() => window.open(fileUrl, "_blank")}
            >
              Open new tab
            </button>
          </div>
        ) : isImg ? (
          <img
            src={fileUrl}
            alt={file.file_name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="bg-white text-black rounded p-8 text-center"         
            onClick={(e) => e.stopPropagation()}>
            <FileText className="h-12 w-12 mb-4" />
            <div>This file type is not supported for preview</div>
            <a
              href={fileUrl}
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Download className="h-5 w-5" />
              Download
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-white text-sm select-none">
        {file.file_name} <span className="mx-2">|</span> {current + 1} /{" "}
        {files.length}
      </div>

      {/* Thumbnail Strip */}
      {files.length > 1 && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
          <div className="flex gap-2">
            {files.map((f, index) => {
              const isCurrent = index === current;
              const isImg = isImage(f.file_extension?.toLowerCase() || "");
              
              return (
                <div
                  key={f.id}
                  className={cn(
                    "flex-shrink-0 cursor-pointer transition-all duration-200",
                    isCurrent 
                      ? "ring-1 ring-white ring-opacity-80" 
                      : "opacity-70 hover:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrent(index);
                  }}
                >
                  {isImg ? (
                    <div className="w-8 h-8 rounded overflow-hidden bg-white">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/attachments/${f.id}`}
                        alt={f.file_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-8 h-8 rounded bg-white flex items-center justify-center text-xs font-medium text-gray-700",
                      isCurrent && "bg-blue-100 "
                    )}>
                      <p>{f.file_extension}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
