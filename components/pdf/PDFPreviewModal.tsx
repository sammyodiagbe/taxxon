'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  filename: string;
  isLoading?: boolean;
  onDownload?: () => void;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  filename,
  isLoading = false,
  onDownload,
}: PDFPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-2xl flex flex-col',
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-[95vw] max-w-5xl h-[90vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-neutral-900">PDF Preview</h2>
            <span className="text-sm text-neutral-500">{filename}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1.5 rounded hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4 text-neutral-600" />
              </button>
              <span className="text-sm text-neutral-600 w-12 text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1.5 rounded hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4 text-neutral-600" />
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-neutral-200"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4 text-neutral-600" />
            </button>

            {/* Download button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!pdfUrl || isLoading}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-neutral-200 ml-1"
              title="Close (Esc)"
            >
              <X className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-sm text-neutral-500">Generating PDF...</p>
            </div>
          ) : pdfUrl ? (
            <div
              className="flex justify-center"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full bg-white shadow-lg rounded"
                style={{
                  height: `${85 * (100 / zoom)}vh`,
                  maxWidth: '850px',
                  minHeight: '600px',
                }}
                title="PDF Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-neutral-500">Failed to load PDF preview</p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
          <p className="text-xs text-neutral-500">
            Press Esc to close
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!pdfUrl || isLoading}>
              <Download className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
