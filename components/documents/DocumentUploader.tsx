'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, X, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DOCUMENT_TYPES, DocumentType, TaxDocument } from '@/types/tax-filing';
import { saveDocument } from '@/lib/db';
import { ExtractionReviewModal } from '@/components/ai/ExtractionReviewModal';
import type { DocumentExtractionResult } from '@/types/ai';

interface DocumentUploaderProps {
  filingId: string;
  onDocumentAdded: (document: TaxDocument) => void;
  onExtractedData?: (documentType: DocumentType, data: Record<string, string | number>) => void;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Document types that support AI extraction
const EXTRACTABLE_TYPES: DocumentType[] = [
  't4', 't4a', 't4e', 't5', 't3', 't2202', 't4rsp', 't5008',
  'rrsp-receipt', 'donation-receipt', 'medical-receipt',
];

export function DocumentUploader({
  filingId,
  onDocumentAdded,
  onExtractedData,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('t4');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<DocumentExtractionResult | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractingFile, setExtractingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const documentTypeOptions = Object.entries(DOCUMENT_TYPES).map(([value, label]) => ({
    value,
    label,
  }));

  const supportsExtraction = EXTRACTABLE_TYPES.includes(selectedType);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Only PDF, JPG, and PNG files are accepted`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be less than 10MB`;
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) setError(errors.join('. '));
    if (validFiles.length > 0) setPendingFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    const errors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) setError(errors.join('. '));
    if (validFiles.length > 0) setPendingFiles((prev) => [...prev, ...validFiles]);

    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of pendingFiles) {
        const document: TaxDocument = {
          id: uuidv4(),
          name: file.name,
          type: selectedType,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };

        await saveDocument(filingId, document, file);
        onDocumentAdded(document);
      }

      setPendingFiles([]);
    } catch (err) {
      setError('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtract = async (file: File) => {
    setIsExtracting(true);
    setExtractingFile(file);
    setShowExtractionModal(true);
    setExtractionResult(null);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/ai/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64,
          mimeType: file.type,
          expectedType: selectedType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Extraction failed');
      }

      const result: DocumentExtractionResult = await response.json();
      setExtractionResult(result);
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract document data');
      setShowExtractionModal(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyExtractedData = async (data: Record<string, string | number>) => {
    if (!extractingFile) return;

    // First save the document
    const document: TaxDocument = {
      id: uuidv4(),
      name: extractingFile.name,
      type: extractionResult?.documentType || selectedType,
      size: extractingFile.size,
      mimeType: extractingFile.type,
      uploadedAt: new Date().toISOString(),
    };

    try {
      await saveDocument(filingId, document, extractingFile);
      onDocumentAdded(document);

      // Then apply the extracted data if handler provided
      if (onExtractedData) {
        onExtractedData(document.type, data);
      }

      // Remove the file from pending
      setPendingFiles((prev) =>
        prev.filter((f) => f.name !== extractingFile.name)
      );
    } catch (err) {
      setError('Failed to save document');
    }

    setShowExtractionModal(false);
    setExtractingFile(null);
    setExtractionResult(null);
  };

  const handleCloseModal = () => {
    setShowExtractionModal(false);
    setExtractingFile(null);
    setExtractionResult(null);
  };

  return (
    <div className="space-y-4">
      <Select
        label="Document type"
        options={documentTypeOptions}
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value as DocumentType)}
      />

      <div
        className={cn(
          'relative rounded-md border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging ? 'border-black bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileSelect}
        />
        <Upload className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-2 text-sm text-neutral-600">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          PDF, JPG, PNG up to 10MB
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">Files to upload:</p>
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-500" />
                <span className="text-sm truncate max-w-[180px]">{file.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Extract with AI button */}
                {supportsExtraction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExtract(file);
                    }}
                    disabled={isExtracting && extractingFile?.name === file.name}
                    isLoading={isExtracting && extractingFile?.name === file.name}
                    className="text-xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Extract
                  </Button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePendingFile(index);
                  }}
                  className="text-neutral-400 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleUpload} isLoading={isUploading} size="sm">
              Upload {pendingFiles.length} file(s)
            </Button>
            {supportsExtraction && pendingFiles.length === 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExtract(pendingFiles[0])}
                disabled={isExtracting}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Extract with AI
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AI hint */}
      {supportsExtraction && pendingFiles.length === 0 && (
        <p className="text-xs text-neutral-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI extraction available for {DOCUMENT_TYPES[selectedType]}
        </p>
      )}

      {/* Extraction review modal */}
      <ExtractionReviewModal
        isOpen={showExtractionModal}
        isLoading={isExtracting}
        result={extractionResult}
        documentType={extractionResult?.documentType || selectedType}
        onClose={handleCloseModal}
        onApply={handleApplyExtractedData}
      />
    </div>
  );
}
