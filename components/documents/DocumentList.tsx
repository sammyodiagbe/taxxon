'use client';

import { FileText, Trash2, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DOCUMENT_TYPES, TaxDocument } from '@/types/tax-filing';
import { getDocument, deleteDocument as deleteFromDB } from '@/lib/db';

interface DocumentListProps {
  documents: TaxDocument[];
  onDocumentRemoved: (id: string) => void;
}

export function DocumentList({ documents, onDocumentRemoved }: DocumentListProps) {
  const handleView = async (doc: TaxDocument) => {
    const stored = await getDocument(doc.id);
    if (stored?.blob) {
      const url = URL.createObjectURL(stored.blob);
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (doc: TaxDocument) => {
    const stored = await getDocument(doc.id);
    if (stored?.blob) {
      const url = URL.createObjectURL(stored.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFromDB(id);
    onDocumentRemoved(id);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-2 text-sm text-neutral-500">No documents uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-md border border-neutral-200 p-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-neutral-500" />
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-neutral-500">{formatSize(doc.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{DOCUMENT_TYPES[doc.type]}</Badge>
            <button
              onClick={() => handleView(doc)}
              className="p-1 text-neutral-400 hover:text-black"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDownload(doc)}
              className="p-1 text-neutral-400 hover:text-black"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1 text-neutral-400 hover:text-black"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
