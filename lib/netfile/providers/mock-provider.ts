// Mock NETFILE Provider for Development/Testing
// Replace with real partner integration in production

import { v4 as uuidv4 } from 'uuid';
import type {
  NetfileProvider,
  NetfileSubmissionRequest,
  NetfileSubmissionResponse,
  NetfileStatusResponse,
} from '../types';

// Simulated processing delay
const MOCK_DELAY = 1500;

// In-memory storage for mock submissions (would be database in production)
const mockSubmissions = new Map<string, {
  request: NetfileSubmissionRequest;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  confirmationNumber: string;
  submittedAt: string;
}>();

export class MockNetfileProvider implements NetfileProvider {
  name = 'Mock Provider (Development)';

  async validateFiling(request: NetfileSubmissionRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!request.personalInfo.sin || request.personalInfo.sin.length !== 11) {
      errors.push('Invalid SIN format');
    }

    if (!request.personalInfo.firstName || !request.personalInfo.lastName) {
      errors.push('Name is required');
    }

    if (request.calculated.totalIncome < 0) {
      errors.push('Total income cannot be negative');
    }

    if (request.taxYear < 2020 || request.taxYear > new Date().getFullYear()) {
      errors.push('Invalid tax year');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async submitFiling(request: NetfileSubmissionRequest): Promise<NetfileSubmissionResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

    // Validate first
    const validation = await this.validateFiling(request);
    if (!validation.valid) {
      return {
        success: false,
        status: 'rejected',
        timestamp: new Date().toISOString(),
        errors: validation.errors.map((msg, idx) => ({
          code: `VALIDATION_${idx + 1}`,
          message: msg,
        })),
      };
    }

    // Generate confirmation number (mimics CRA format)
    const confirmationNumber = `CRA-${request.taxYear}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Store submission
    mockSubmissions.set(confirmationNumber, {
      request,
      status: 'submitted',
      confirmationNumber,
      submittedAt: new Date().toISOString(),
    });

    // Simulate async acceptance (in reality, CRA processes over hours/days)
    setTimeout(() => {
      const submission = mockSubmissions.get(confirmationNumber);
      if (submission) {
        submission.status = 'accepted';
      }
    }, 5000);

    return {
      success: true,
      confirmationNumber,
      status: 'submitted',
      timestamp: new Date().toISOString(),
      warnings: [
        'This is a mock submission for development purposes.',
        'In production, connect to a certified NETFILE partner.',
      ],
    };
  }

  async checkStatus(confirmationNumber: string): Promise<NetfileStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const submission = mockSubmissions.get(confirmationNumber);

    if (!submission) {
      return {
        filingId: '',
        status: 'error',
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      filingId: submission.request.filingId,
      confirmationNumber,
      status: submission.status,
      lastUpdated: new Date().toISOString(),
      craAssessmentDate: submission.status === 'accepted'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        : undefined,
    };
  }
}

// Export singleton instance
export const mockProvider = new MockNetfileProvider();
