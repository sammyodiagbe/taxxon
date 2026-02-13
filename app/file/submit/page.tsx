'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Send, Download, AlertCircle, CheckCircle, Loader2, Eye } from 'lucide-react';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type SubmissionMethod = 'netfile' | 'pdf' | null;

export default function SubmitPage() {
  const router = useRouter();
  const { currentFiling, calculateSummary, submitFiling } = useTaxFiling();
  const [selectedMethod, setSelectedMethod] = useState<SubmissionMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitWarnings, setSubmitWarnings] = useState<string[]>([]);

  // PDF Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleBack = () => {
    router.push('/file/review');
  };

  const handleNetfileSubmit = async () => {
    if (!hasAgreed || !currentFiling) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitWarnings([]);

    try {
      const summary = calculateSummary();

      // First validate
      const validateResponse = await fetch('/api/filing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filing: currentFiling,
          summary,
          validateOnly: true,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateData.valid) {
        setSubmitError(`Validation failed: ${validateData.errors.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Submit via NETFILE
      const submitResponse = await fetch('/api/filing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filing: currentFiling,
          summary,
          validateOnly: false,
        }),
      });

      const submitData = await submitResponse.json();

      if (!submitData.success) {
        setSubmitError(submitData.errors?.[0]?.message || 'Submission failed');
        setIsSubmitting(false);
        return;
      }

      if (submitData.warnings) {
        setSubmitWarnings(submitData.warnings);
      }

      // Update local state
      const confirmationNumber = submitData.confirmationNumber || submitFiling();
      router.push(`/confirmation?confirmation=${confirmationNumber}`);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Failed to connect to filing service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentFiling) return;

    setIsDownloading(true);
    setSubmitError(null);

    try {
      const summary = calculateSummary();

      const response = await fetch('/api/filing/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filing: currentFiling,
          summary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tax_Return_${currentFiling.year}_${currentFiling.personalInfo.lastName || 'Summary'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      setSubmitError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewPDF = useCallback(async () => {
    if (!currentFiling) return;

    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    setPreviewUrl(null);
    setSubmitError(null);

    try {
      const summary = calculateSummary();

      const response = await fetch('/api/filing/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filing: currentFiling,
          summary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('PDF preview error:', error);
      setSubmitError('Failed to generate PDF preview. Please try again.');
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [currentFiling, calculateSummary]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    // Clean up the blob URL after a short delay
    if (previewUrl) {
      setTimeout(() => {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }, 100);
    }
  }, [previewUrl]);

  const pdfFilename = currentFiling
    ? `Tax_Return_${currentFiling.year}_${currentFiling.personalInfo.lastName || 'Summary'}.pdf`
    : 'Tax_Return.pdf';

  if (!currentFiling) return null;

  const summary = calculateSummary();

  if (currentFiling.status === 'submitted') {
    return (
      <div className="space-y-6">
        <Alert variant="info">
          This return has been submitted. Confirmation: {currentFiling.confirmationNumber}
        </Alert>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black">Submit Your Return</h1>
        <p className="text-neutral-600 mt-1">Choose how you want to file with the CRA</p>
      </div>

      {/* Summary */}
      <Card className="border-2 border-black">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-neutral-500 mb-1">
            {currentFiling.year} Tax Return
          </p>
          <p className="font-medium text-neutral-900 mb-4">
            {currentFiling.personalInfo.firstName} {currentFiling.personalInfo.lastName}
          </p>
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-600 mb-1">
              {summary.refundOrOwing >= 0 ? 'Estimated Refund' : 'Balance Owing'}
            </p>
            <p className={cn(
              'text-3xl font-semibold',
              summary.refundOrOwing >= 0 ? 'text-green-700' : 'text-amber-700'
            )}>
              {formatCurrency(Math.abs(summary.refundOrOwing))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filing Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">Choose Filing Method</h2>

        {/* Option A: NETFILE */}
        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedMethod === 'netfile'
              ? 'border-2 border-black ring-2 ring-black/5'
              : 'border border-neutral-200 hover:border-neutral-300'
          )}
          onClick={() => setSelectedMethod('netfile')}
        >
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className={cn(
                'p-3 rounded-lg',
                selectedMethod === 'netfile' ? 'bg-black' : 'bg-neutral-100'
              )}>
                <Send className={cn(
                  'h-6 w-6',
                  selectedMethod === 'netfile' ? 'text-white' : 'text-neutral-600'
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900">Submit via NETFILE</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  Submit directly to CRA through our certified partner. Fastest processing time.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Instant confirmation
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Direct deposit eligible
                  </span>
                </div>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                selectedMethod === 'netfile'
                  ? 'border-black bg-black'
                  : 'border-neutral-300'
              )}>
                {selectedMethod === 'netfile' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option B: PDF Download */}
        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedMethod === 'pdf'
              ? 'border-2 border-black ring-2 ring-black/5'
              : 'border border-neutral-200 hover:border-neutral-300'
          )}
          onClick={() => setSelectedMethod('pdf')}
        >
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className={cn(
                'p-3 rounded-lg',
                selectedMethod === 'pdf' ? 'bg-black' : 'bg-neutral-100'
              )}>
                <FileText className={cn(
                  'h-6 w-6',
                  selectedMethod === 'pdf' ? 'text-white' : 'text-neutral-600'
                )} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Download PDF Summary</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Get a printable PDF to file manually through CRA My Account or by mail.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Print & file yourself
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Keep for records
                  </span>
                </div>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                selectedMethod === 'pdf'
                  ? 'border-black bg-black'
                  : 'border-neutral-300'
              )}>
                {selectedMethod === 'pdf' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement (only for NETFILE) */}
      {selectedMethod === 'netfile' && (
        <Card>
          <CardContent className="py-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <div>
                <p className="font-medium text-neutral-900">
                  I certify this information is correct
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  I confirm the information provided is accurate and complete. I understand that
                  filing false information is a serious offense.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Errors and warnings */}
      {submitError && (
        <Alert variant="error">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{submitError}</span>
          </div>
        </Alert>
      )}

      {submitWarnings.length > 0 && (
        <Alert variant="warning">
          <ul className="list-disc list-inside text-sm">
            {submitWarnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {summary.refundOrOwing < 0 && (
        <Alert variant="info">
          Payment of {formatCurrency(Math.abs(summary.refundOrOwing))} is due by April 30.
        </Alert>
      )}

      {/* Action buttons */}
      <div className="pt-4 space-y-3">
        {selectedMethod === 'netfile' && (
          <Button
            size="lg"
            onClick={handleNetfileSubmit}
            disabled={!hasAgreed || isSubmitting}
            isLoading={isSubmitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit to CRA'}
          </Button>
        )}

        {selectedMethod === 'pdf' && (
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={isDownloading || isPreviewLoading}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              size="lg"
              onClick={handleDownloadPDF}
              disabled={isDownloading || isPreviewLoading}
              isLoading={isDownloading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        )}

        {!selectedMethod && (
          <p className="text-center text-sm text-neutral-500">
            Select a filing method above to continue
          </p>
        )}

        {selectedMethod === 'netfile' && !hasAgreed && (
          <p className="text-center text-sm text-neutral-500">
            Please agree to the certification to submit
          </p>
        )}
      </div>

      {/* Additional PDF options (always available) */}
      {selectedMethod === 'netfile' && (
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewPDF}
              disabled={isDownloading || isPreviewLoading}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading || isPreviewLoading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <p className="text-xs text-neutral-500 text-center mt-2">
            Keep a copy of your return for your records
          </p>
        </div>
      )}

      <WizardNavigation
        currentStep="submit"
        onBack={handleBack}
        onNext={selectedMethod === 'netfile' ? handleNetfileSubmit : handleDownloadPDF}
        isNextDisabled={selectedMethod === 'netfile' ? !hasAgreed : !selectedMethod}
        isLoading={isSubmitting || isDownloading}
        nextLabel={selectedMethod === 'netfile' ? 'Submit to CRA' : 'Download PDF'}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        pdfUrl={previewUrl}
        filename={pdfFilename}
        isLoading={isPreviewLoading}
        onDownload={handleDownloadPDF}
      />
    </div>
  );
}
