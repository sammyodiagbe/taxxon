'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Clock, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { formatCurrency } from '@/lib/utils';
import type { FilingStatus } from '@/types/tax-filing';

const statusConfig: Record<FilingStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'info' }> = {
  'not-started': { label: 'Not Started', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'warning' },
  'submitted': { label: 'Submitted', variant: 'success' },
  'accepted': { label: 'Accepted', variant: 'success' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { filings, createFiling, loadFiling, deleteFiling } = useTaxFiling();

  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;

  const handleStartFiling = () => {
    const existingFiling = filings.find((f) => f.year === taxYear && f.status !== 'submitted');
    if (existingFiling) {
      loadFiling(existingFiling.id);
    } else {
      createFiling(taxYear);
    }
    router.push('/file/personal-info');
  };

  const handleContinueFiling = (filingId: string) => {
    loadFiling(filingId);
    router.push('/file/personal-info');
  };

  const handleViewFiling = (filingId: string) => {
    loadFiling(filingId);
    router.push('/file/review');
  };

  const handleDeleteFiling = (filingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this filing?')) {
      deleteFiling(filingId);
    }
  };

  const inProgressFilings = filings.filter((f) => f.status === 'in-progress' || f.status === 'not-started');
  const submittedFilings = filings.filter((f) => f.status === 'submitted' || f.status === 'accepted');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-tight hover:opacity-80">
              Taxxon
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-black">Tax Filings</h1>
            <p className="text-neutral-600 mt-1">Manage your tax returns</p>
          </div>
          <Button onClick={handleStartFiling}>
            <Plus className="h-4 w-4 mr-2" />
            New Filing
          </Button>
        </div>

        {/* In Progress */}
        {inProgressFilings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-neutral-500 mb-4">In Progress</h2>
            <div className="space-y-3">
              {inProgressFilings.map((filing) => (
                <Card key={filing.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                        <Clock className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-black">{filing.year} Tax Return</span>
                          <Badge variant={statusConfig[filing.status].variant}>
                            {statusConfig[filing.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Updated {new Date(filing.updatedAt).toLocaleDateString('en-CA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteFiling(filing.id, e)}
                        className="p-2 text-neutral-400 hover:text-black"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Button onClick={() => handleContinueFiling(filing.id)} size="sm">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Submitted */}
        {submittedFilings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-neutral-500 mb-4">Submitted</h2>
            <div className="space-y-3">
              {submittedFilings.map((filing) => (
                <Card key={filing.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-black">{filing.year} Tax Return</span>
                          <Badge variant="success">Submitted</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                          <span>{filing.confirmationNumber}</span>
                          {filing.summary && (
                            <span className={filing.summary.refundOrOwing >= 0 ? 'text-black font-medium' : 'text-black font-medium'}>
                              {filing.summary.refundOrOwing >= 0 ? 'Refund: ' : 'Owing: '}
                              {formatCurrency(Math.abs(filing.summary.refundOrOwing))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleViewFiling(filing.id)} size="sm">
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filings.length === 0 && (
          <div className="text-center py-16 border border-dashed border-neutral-300 rounded-lg">
            <FileText className="mx-auto h-10 w-10 text-neutral-400" />
            <h3 className="mt-4 font-medium text-black">No tax filings</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Start your first filing for the {taxYear} tax year
            </p>
            <Button className="mt-6" onClick={handleStartFiling}>
              <Plus className="h-4 w-4 mr-2" />
              Start Filing
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
