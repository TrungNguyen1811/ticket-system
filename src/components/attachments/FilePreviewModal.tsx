import { X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, ImageIcon } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { Attachment } from "@/types/ticket";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDF_EXTS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

function canPreviewWithPdfViewer(ext: string) {
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
  files,
  open,
  initialIndex = 0,
  onClose,
}: FilePreviewOverlayProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    setCurrent(initialIndex);
    setPdfNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
  }, [open, initialIndex]);

  const file = files[current];
  const ext = file?.file_extension?.toLowerCase() || "";
  const canPdf = canPreviewWithPdfViewer(ext);
  const isImg = isImage(ext);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Enter") next();
    },
    [open, current, files]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  function prev() {
    setPdfNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
    setCurrent((c) => (c > 0 ? c - 1 : files.length - 1));
  }
  function next() {
    setPdfNumPages(null);
    setPdfError(false);
    setAutoOpened(false);
    setCurrent((c) => (c < files.length - 1 ? c + 1 : 0));
  }

  // Download handler (force download, not open tab)
  function handleDownload() {
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL}/attachments/${file.id}/download`;
    link.download = file.file_name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Auto open new tab for long PDF or on error
  useEffect(() => {
    if (!open || !canPdf || !pdfNumPages || autoOpened) return;
    if (pdfNumPages > 5 || pdfError) {
      window.open(`${import.meta.env.VITE_API_URL}/attachments/${file.id}`, "_blank");
      setAutoOpened(true);
      setTimeout(onClose, 300); // auto close overlay
    }
  }, [open, canPdf, pdfNumPages, pdfError, file, autoOpened, onClose]);

  // Animation: fade in/out
  useEffect(() => {
    if (open && overlayRef.current) {
      overlayRef.current.classList.remove("opacity-0");
      overlayRef.current.classList.add("opacity-100");
    }
  }, [open]);

  if (!open) return null;
  if (!file) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center text-white">
          <FileText className="mx-auto mb-2 h-10 w-10" />
          <div className="text-lg">No file to preview</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 transition-opacity duration-200 opacity-0",
        "animate-fade-in"
      )}
      tabIndex={-1}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-60 bg-black/60 hover:bg-black/80 rounded-full p-2 text-white"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev/Next arrows */}
      {files.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-60 bg-black/60 hover:bg-black/80 rounded-full p-2 text-white"
            onClick={prev}
            aria-label="Previous"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-60 bg-black/60 hover:bg-black/80 rounded-full p-2 text-white"
            onClick={next}
            aria-label="Next"
          >
            <ArrowRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Download button */}
      <button
        className="absolute top-4 left-4 z-60 bg-black/60 hover:bg-black/80 rounded-full p-2 text-white"
        onClick={handleDownload}
        aria-label="Download"
      >
        <Download className="h-6 w-6" />
      </button>

      {/* File content */}
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="flex items-center justify-center w-full h-full">
          {/* PDF Preview */}
          {canPdf ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] p-2">
              <Document
                file={`${import.meta.env.VITE_API_URL}/attachments/${file.id}`}
                onLoadSuccess={({ numPages }: { numPages: number }) => setPdfNumPages(numPages)}
                onLoadError={() => setPdfError(true)}
                loading={
                  <div className="flex items-center justify-center h-40 w-40">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading PDF...</span>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-40 w-40">
                    <FileText className="h-8 w-8 text-red-400" />
                    <span className="mt-2 text-red-400">Không hỗ trợ xem trước</span>
                  </div>
                }
              >
                {pdfNumPages && pdfNumPages <= 5 ? (
                  Array.from(new Array(pdfNumPages), (_, idx) => (
                    <Page
                      key={`page_${idx + 1}`}
                      pageNumber={idx + 1}
                      width={Math.min(800, window.innerWidth * 0.9)}
                    />
                  ))
                ) : null}
              </Document>
            </div>
          ) : isImg ? (
            <img
              src={`${import.meta.env.VITE_API_URL}/attachments/${file.id}`}
              alt={file.file_name}
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg object-contain bg-white"
              style={{ transition: "all 0.2s" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] p-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <span className="text-lg text-muted-foreground">Không hỗ trợ xem trước</span>
              <a
                href={`${import.meta.env.VITE_API_URL}/attachments/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
              >
                <Download className="h-5 w-5" />
                Download file
              </a>
            </div>
          )}
        </div>
        {/* File name and index */}
        <div className="mt-4 text-white text-xs text-center select-none">
          {file.file_name} <span className="mx-2">|</span> {current + 1} / {files.length}
        </div>
      </div>
    </div>
  );
}
  