'use client';

import { useRouter } from 'next/navigation';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { DocumentList } from '@/components/documents/DocumentList';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function DocumentsPage() {
  const router = useRouter();
  const { currentFiling, addDocument, removeDocument } = useTaxFiling();

  const handleBack = () => {
    router.push('/file/deductions');
  };

  const handleNext = () => {
    router.push('/file/review');
  };

  if (!currentFiling) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-600">
          Upload copies of your tax slips and receipts for your records
        </p>
      </div>

      <Alert variant="info">
        Uploading documents is optional but recommended. Keep copies of all your tax slips
        and receipts for at least 6 years in case of a CRA review.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop your files or click to browse. Supported formats: PDF, JPG, PNG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            filingId={currentFiling.id}
            onDocumentAdded={addDocument}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            {currentFiling.documents.length} document(s) uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList
            documents={currentFiling.documents}
            onDocumentRemoved={removeDocument}
          />
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep="documents"
        onBack={handleBack}
        onNext={handleNext}
        nextLabel="Review Return"
      />
    </div>
  );
}
