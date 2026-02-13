# NETFILE Provider Integration Setup

This guide walks you through setting up a certified NETFILE provider for CRA tax return submission.

## Overview

NETFILE is the CRA's electronic filing system for personal income tax returns. As a tax software provider, you cannot connect directly to CRA—you must work through a certified NETFILE partner who has completed CRA's certification process.

## Step 1: Partner Selection

### Certified Partners

Contact one of these certified providers to discuss partnership:

| Partner | Website | Best For |
|---------|---------|----------|
| **Intuit** | developer.intuit.com | High volume, established network |
| **Thomson Reuters** | tax.thomsonreuters.ca | Enterprise/professional solutions |
| **Wolters Kluwer (CCH)** | cchgroup.com | Accounting firms |
| **Dr Tax Software** | drtax.ca | Canadian market focus |
| **TaxCycle** | taxcycle.com | Professional tax preparers |

### What to Expect

The partnership process typically involves:

1. **Application** - Submit your business details and software information
2. **Agreement** - Sign data handling and privacy agreements
3. **Sandbox Access** - Receive test environment credentials
4. **Development** - Implement their API (XML or REST)
5. **Certification Testing** - Pass CRA's required test scenarios
6. **Production** - Go live with real submissions

Timeline: 2-4 months depending on partner and testing requirements.

## Step 2: Environment Configuration

Once you have credentials, configure your environment:

```bash
# .env.local

# Switch from mock to your partner
NETFILE_PROVIDER=example-partner

# Partner API credentials
NETFILE_PARTNER_API_URL=https://api.partner.com
NETFILE_PARTNER_API_KEY=your-api-key-here
NETFILE_PARTNER_SECRET=your-secret-here
NETFILE_SOFTWARE_ID=SW-123456  # Assigned by CRA during certification
```

## Step 3: Implement Your Provider

Create a new provider file based on the example:

```
lib/netfile/providers/
├── mock-provider.ts           # Development/testing
├── example-partner-provider.ts # Template for real provider
└── your-partner-provider.ts   # Your implementation
```

### Required Interface

Your provider must implement `NetfileProvider`:

```typescript
interface NetfileProvider {
  name: string;

  // Validate before submission (catches errors early)
  validateFiling(request: NetfileSubmissionRequest): Promise<{
    valid: boolean;
    errors: string[];
  }>;

  // Submit to CRA via partner
  submitFiling(request: NetfileSubmissionRequest): Promise<NetfileSubmissionResponse>;

  // Check submission status
  checkStatus(confirmationNumber: string): Promise<NetfileStatusResponse>;
}
```

### Key Implementation Points

1. **Authentication**: Most partners use OAuth2 client credentials flow
2. **Data Format**: Transform our `NetfileSubmissionRequest` to partner's format (often XML)
3. **Error Mapping**: Map partner-specific error codes to user-friendly messages
4. **Status Polling**: Implement status checking for async processing
5. **Logging**: Log all API calls for debugging (but never log SIN/sensitive data)

## Step 4: Register Your Provider

In `lib/netfile/service.ts`:

```typescript
import { yourPartnerProvider } from './providers/your-partner-provider';

const providers: Record<string, NetfileProvider> = {
  mock: mockProvider,
  'your-partner': yourPartnerProvider,  // Add your provider
};
```

## Step 5: Testing

### Sandbox Testing

1. Set `NETFILE_PROVIDER=your-partner` in `.env.local`
2. Use partner's sandbox credentials
3. Submit test returns with CRA-provided test SINs
4. Verify confirmation numbers are returned
5. Test error scenarios (invalid SIN, missing fields, etc.)

### CRA Test Scenarios

CRA requires you to pass specific test scenarios:

- Basic T1 return
- Return with RRSP contributions
- Return with self-employment income
- Return with dependants
- Return requiring reassessment
- Various error conditions

Your partner will provide the exact test cases.

## Step 6: Go Live

1. Complete all certification testing
2. Obtain production credentials from partner
3. Update `.env.local` with production values
4. Remove mock warnings from UI
5. Monitor first few production submissions closely

## Security Requirements

1. **Never log sensitive data** - SIN, full name, DOB should never appear in logs
2. **Encrypt at rest** - Store any cached data encrypted
3. **Secure transmission** - Always use HTTPS
4. **Token management** - Refresh tokens before expiry, never expose to client
5. **Rate limiting** - Implement rate limits to prevent abuse

## CRA Line Number Reference

Common T1 line numbers used in NETFILE:

| Line | Description |
|------|-------------|
| 10100 | Employment income |
| 10400 | Other employment income |
| 12100 | Investment income |
| 13500 | Self-employment income |
| 15000 | Total income |
| 20800 | RRSP contributions |
| 23600 | Net income |
| 26000 | Taxable income |
| 30000 | Basic personal amount |
| 42000 | Total payable |
| 48400 | Refund or balance owing |

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Check API key and secret are correct
- Verify you're using the right environment (sandbox vs production)
- Check if credentials have expired

**"Invalid SIN"**
- SIN must be 9 digits without dashes
- Use test SINs for sandbox (partner provides these)

**"Transmission rejected"**
- Check all required fields are present
- Verify tax year is current or previous year
- Ensure calculations match expected values

### Getting Help

- Partner support: Contact your NETFILE partner's developer support
- CRA specifications: Available through partner portal
- This codebase: Check `mock-provider.ts` for expected behavior

## Resources

- [CRA NETFILE Program](https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/netfile-certified-software.html)
- [CRA Developer Information](https://www.canada.ca/en/revenue-agency/services/e-services/developers.html)
- [T1 General Guide](https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package.html)
