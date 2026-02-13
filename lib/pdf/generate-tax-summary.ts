// Tax Summary PDF Generator
// Generates a professional PDF with detailed explanations for users

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import type { TaxFiling, TaxSummary } from '@/types/tax-filing';
import { PROVINCES, MARITAL_STATUSES } from '@/types/tax-filing';

interface PDFGenerationResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  error?: string;
}

// Professional color palette
const COLORS = {
  primary: rgb(0.1, 0.1, 0.1),        // Near black
  secondary: rgb(0.4, 0.4, 0.4),       // Dark gray
  muted: rgb(0.6, 0.6, 0.6),           // Medium gray
  light: rgb(0.92, 0.92, 0.92),        // Light gray
  lighter: rgb(0.96, 0.96, 0.96),      // Very light gray
  white: rgb(1, 1, 1),
  accent: rgb(0.18, 0.55, 0.34),       // Forest green
  accentLight: rgb(0.9, 0.96, 0.92),   // Light green
  warning: rgb(0.8, 0.6, 0.2),         // Amber
  warningLight: rgb(1, 0.97, 0.9),     // Light amber
  info: rgb(0.2, 0.4, 0.7),            // Blue
  infoLight: rgb(0.92, 0.95, 1),       // Light blue
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function drawHeader(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  filing: TaxFiling,
  pageNum: number,
  totalPages: number
) {
  const { width, height } = page.getSize();

  // Top bar
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width: width,
    height: 60,
    color: COLORS.primary,
  });

  // Logo/Brand
  page.drawText('TAXXON', {
    x: 50,
    y: height - 38,
    size: 20,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Tax year badge
  page.drawText(`${filing.year} TAX RETURN`, {
    x: width - 150,
    y: height - 38,
    size: 12,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Page number
  page.drawText(`Page ${pageNum} of ${totalPages}`, {
    x: width - 100,
    y: 30,
    size: 9,
    font: fonts.regular,
    color: COLORS.muted,
  });

  // Bottom line
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 0.5,
    color: COLORS.light,
  });
}

function drawSectionHeader(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  title: string,
  y: number,
  width: number
): number {
  page.drawRectangle({
    x: 50,
    y: y - 4,
    width: width - 100,
    height: 24,
    color: COLORS.light,
  });

  page.drawText(title, {
    x: 62,
    y: y + 4,
    size: 11,
    font: fonts.bold,
    color: COLORS.primary,
  });

  return y - 35;
}

function drawKeyValue(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  label: string,
  value: string,
  y: number,
  labelX: number = 62,
  valueX: number = 250,
  highlight: boolean = false
): number {
  if (highlight) {
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 512,
      height: 20,
      color: COLORS.accentLight,
    });
  }

  page.drawText(label, {
    x: labelX,
    y,
    size: 10,
    font: fonts.regular,
    color: highlight ? COLORS.primary : COLORS.secondary,
  });

  page.drawText(value, {
    x: valueX,
    y,
    size: 10,
    font: highlight ? fonts.bold : fonts.regular,
    color: COLORS.primary,
  });

  return y - 22;
}

function drawAmountRow(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  label: string,
  amount: number,
  y: number,
  isTotal: boolean = false,
  isRefund: boolean = false
): number {
  const { width } = page.getSize();

  if (isTotal) {
    page.drawRectangle({
      x: 50,
      y: y - 6,
      width: width - 100,
      height: 26,
      color: isRefund ? COLORS.accentLight : COLORS.warningLight,
    });
  }

  page.drawText(label, {
    x: 62,
    y,
    size: isTotal ? 11 : 10,
    font: isTotal ? fonts.bold : fonts.regular,
    color: isTotal ? COLORS.primary : COLORS.secondary,
  });

  page.drawText(formatCurrency(amount), {
    x: width - 150,
    y,
    size: isTotal ? 11 : 10,
    font: fonts.bold,
    color: isTotal && isRefund ? COLORS.accent : COLORS.primary,
  });

  return y - (isTotal ? 32 : 22);
}

// Helper to wrap text into multiple lines
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 10,
  color = COLORS.secondary,
  lineHeight: number = 16
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);

  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }

  return y;
}

function drawInfoBox(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  title: string,
  content: string,
  x: number,
  y: number,
  width: number,
  bgColor = COLORS.infoLight,
  borderColor = COLORS.info
): number {
  const lines = wrapText(content, fonts.regular, 9, width - 40);
  const boxHeight = 35 + lines.length * 14;

  page.drawRectangle({
    x,
    y: y - boxHeight,
    width,
    height: boxHeight,
    color: bgColor,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText(title, {
    x: x + 15,
    y: y - 20,
    size: 10,
    font: fonts.bold,
    color: COLORS.primary,
  });

  let textY = y - 38;
  for (const line of lines) {
    page.drawText(line, {
      x: x + 15,
      y: textY,
      size: 9,
      font: fonts.regular,
      color: COLORS.secondary,
    });
    textY -= 14;
  }

  return y - boxHeight - 15;
}

function drawBulletPoint(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  boldPart?: string
): number {
  page.drawText('•', {
    x,
    y,
    size: 10,
    font: fonts.bold,
    color: COLORS.accent,
  });

  if (boldPart) {
    const boldWidth = fonts.bold.widthOfTextAtSize(boldPart, 10);
    page.drawText(boldPart, {
      x: x + 15,
      y,
      size: 10,
      font: fonts.bold,
      color: COLORS.primary,
    });

    const remainingText = text.replace(boldPart, '').trim();
    const lines = wrapText(remainingText, fonts.regular, 10, maxWidth - boldWidth - 20);

    if (lines.length > 0) {
      page.drawText(lines[0], {
        x: x + 15 + boldWidth + 4,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.secondary,
      });

      let lineY = y - 16;
      for (let i = 1; i < lines.length; i++) {
        page.drawText(lines[i], {
          x: x + 15,
          y: lineY,
          size: 10,
          font: fonts.regular,
          color: COLORS.secondary,
        });
        lineY -= 16;
      }
      return lineY;
    }
    return y - 20;
  }

  const lines = wrapText(text, fonts.regular, 10, maxWidth - 20);
  let lineY = y;
  for (let i = 0; i < lines.length; i++) {
    page.drawText(lines[i], {
      x: x + 15,
      y: lineY,
      size: 10,
      font: fonts.regular,
      color: COLORS.secondary,
    });
    lineY -= 16;
  }

  return lineY - 4;
}

export async function generateTaxSummaryPDF(
  filing: TaxFiling,
  summary: TaxSummary
): Promise<PDFGenerationResult> {
  try {
    const pdfDoc = await PDFDocument.create();
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fonts = { regular, bold };

    const { personalInfo, income, deductions } = filing;
    const isRefund = summary.refundOrOwing >= 0;
    const totalPages = 5;

    // ========== PAGE 1: Summary ==========
    let page = pdfDoc.addPage([612, 792]);
    let { width, height } = page.getSize();
    let y = height - 100;

    drawHeader(page, fonts, filing, 1, totalPages);

    // Title
    page.drawText('Tax Return Summary', {
      x: 50,
      y,
      size: 24,
      font: bold,
      color: COLORS.primary,
    });

    y -= 20;
    page.drawText(`Prepared ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
      x: 50,
      y,
      size: 10,
      font: regular,
      color: COLORS.muted,
    });

    // Main result box
    y -= 50;
    const boxColor = isRefund ? COLORS.accentLight : COLORS.warningLight;
    const textColor = isRefund ? COLORS.accent : COLORS.warning;

    page.drawRectangle({
      x: 50,
      y: y - 70,
      width: width - 100,
      height: 90,
      color: boxColor,
      borderColor: textColor,
      borderWidth: 2,
    });

    page.drawText(isRefund ? 'ESTIMATED REFUND' : 'BALANCE OWING', {
      x: 70,
      y: y - 25,
      size: 12,
      font: bold,
      color: textColor,
    });

    page.drawText(formatCurrency(Math.abs(summary.refundOrOwing)), {
      x: 70,
      y: y - 55,
      size: 32,
      font: bold,
      color: textColor,
    });

    // Quick stats on the right
    page.drawText('Total Income', {
      x: 350,
      y: y - 25,
      size: 9,
      font: regular,
      color: COLORS.secondary,
    });
    page.drawText(formatCurrency(summary.totalIncome), {
      x: 350,
      y: y - 38,
      size: 12,
      font: bold,
      color: COLORS.primary,
    });

    page.drawText('Tax Paid', {
      x: 460,
      y: y - 25,
      size: 9,
      font: regular,
      color: COLORS.secondary,
    });
    page.drawText(formatCurrency(summary.totalPaid), {
      x: 460,
      y: y - 38,
      size: 12,
      font: bold,
      color: COLORS.primary,
    });

    // Personal Information
    y -= 110;
    y = drawSectionHeader(page, fonts, 'TAXPAYER INFORMATION', y, width);

    const personalFields = [
      ['Full Name', `${personalInfo.firstName} ${personalInfo.lastName}`],
      ['Social Insurance Number', personalInfo.sin || '—'],
      ['Date of Birth', formatDate(personalInfo.dateOfBirth)],
      ['Province of Residence', personalInfo.province ? PROVINCES[personalInfo.province] : '—'],
      ['Marital Status', personalInfo.maritalStatus ? MARITAL_STATUSES[personalInfo.maritalStatus] : '—'],
    ];

    for (const [label, value] of personalFields) {
      y = drawKeyValue(page, fonts, label, value, y);
    }

    // Income Summary
    y -= 15;
    y = drawSectionHeader(page, fonts, 'INCOME SUMMARY', y, width);

    const t4Total = income.t4Slips.reduce((sum, s) => sum + s.employmentIncome, 0);
    const t4TaxWithheld = income.t4Slips.reduce((sum, s) => sum + s.incomeTaxDeducted, 0);
    const t5Total = income.t5Slips.reduce((sum, s) => sum + s.actualDividends + s.interestFromCanadianSources, 0);
    const t4aTotal = income.t4aSlips.reduce((sum, s) => sum + s.pensionIncome + s.lumpSumPayments + s.selfEmployedCommissions + s.otherIncome, 0);
    const t4eTotal = income.t4eSlips.reduce((sum, s) => sum + s.eiBenefits, 0);

    if (t4Total > 0) y = drawAmountRow(page, fonts, `Employment Income (${income.t4Slips.length} T4 slip${income.t4Slips.length > 1 ? 's' : ''})`, t4Total, y);
    if (t4aTotal > 0) y = drawAmountRow(page, fonts, 'Pension & Other Income (T4A)', t4aTotal, y);
    if (t4eTotal > 0) y = drawAmountRow(page, fonts, 'Employment Insurance (T4E)', t4eTotal, y);
    if (t5Total > 0) y = drawAmountRow(page, fonts, 'Investment Income (T5)', t5Total, y);
    if (income.selfEmploymentIncome > 0) y = drawAmountRow(page, fonts, 'Self-Employment Income', income.selfEmploymentIncome, y);
    if (income.otherIncome > 0) y = drawAmountRow(page, fonts, 'Other Income', income.otherIncome, y);

    y -= 5;
    y = drawAmountRow(page, fonts, 'TOTAL INCOME', summary.totalIncome, y, true, false);

    // Deductions Summary
    y -= 10;
    y = drawSectionHeader(page, fonts, 'DEDUCTIONS', y, width);

    const rrspTotal = deductions.rrspContributions.reduce((sum, c) => sum + c.contributionAmount, 0);
    const unionDues = income.t4Slips.reduce((sum, s) => sum + s.unionDues, 0);
    const homeOffice = deductions.homeOfficeMethod === 'flat-rate' ? deductions.homeOfficeDays * 2 : 0;

    if (rrspTotal > 0) y = drawAmountRow(page, fonts, 'RRSP Contributions', rrspTotal, y);
    if (unionDues > 0) y = drawAmountRow(page, fonts, 'Union Dues', unionDues, y);
    if (homeOffice > 0) y = drawAmountRow(page, fonts, `Home Office (${deductions.homeOfficeDays} days)`, homeOffice, y);
    if (deductions.childcareExpenses > 0) y = drawAmountRow(page, fonts, 'Childcare Expenses', deductions.childcareExpenses, y);
    if (deductions.movingExpenses > 0) y = drawAmountRow(page, fonts, 'Moving Expenses', deductions.movingExpenses, y);
    if (deductions.professionalDues > 0) y = drawAmountRow(page, fonts, 'Professional Dues', deductions.professionalDues, y);

    y -= 5;
    y = drawAmountRow(page, fonts, 'TOTAL DEDUCTIONS', summary.totalDeductions, y, true, false);

    // ========== PAGE 2: Tax Calculation ==========
    page = pdfDoc.addPage([612, 792]);
    y = height - 100;

    drawHeader(page, fonts, filing, 2, totalPages);

    // Tax Calculation
    page.drawText('Tax Calculation Details', {
      x: 50,
      y,
      size: 24,
      font: bold,
      color: COLORS.primary,
    });

    y -= 40;
    y = drawSectionHeader(page, fonts, 'TAXABLE INCOME', y, width);

    y = drawAmountRow(page, fonts, 'Total Income', summary.totalIncome, y);
    y = drawAmountRow(page, fonts, 'Less: Deductions', -summary.totalDeductions, y);
    y -= 5;
    y = drawAmountRow(page, fonts, 'TAXABLE INCOME', summary.taxableIncome, y, true, false);

    // Federal Tax
    y -= 10;
    y = drawSectionHeader(page, fonts, 'FEDERAL TAX', y, width);
    y = drawAmountRow(page, fonts, 'Federal Tax on Taxable Income', summary.federalTax, y);

    // Provincial Tax
    y -= 10;
    y = drawSectionHeader(page, fonts, 'PROVINCIAL TAX', y, width);
    y = drawAmountRow(page, fonts, `Provincial Tax (${personalInfo.province || 'ON'})`, summary.provincialTax, y);

    // Credits
    y -= 10;
    y = drawSectionHeader(page, fonts, 'TAX CREDITS', y, width);

    const donationsTotal = deductions.charitableDonations.reduce((sum, d) => sum + d.donationAmount, 0);
    const medicalTotal = deductions.medicalExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tuitionTotal = income.t2202Slips.reduce((sum, s) => sum + s.eligibleTuitionFees, 0);

    y = drawAmountRow(page, fonts, 'Basic Personal Amount Credit', 15705 * 0.15, y);
    if (donationsTotal > 0) y = drawAmountRow(page, fonts, 'Charitable Donations Credit', donationsTotal * 0.15, y);
    if (medicalTotal > 0) y = drawAmountRow(page, fonts, 'Medical Expenses Credit', Math.max(0, medicalTotal - summary.totalIncome * 0.03) * 0.15, y);
    if (tuitionTotal > 0) y = drawAmountRow(page, fonts, 'Tuition Credit', tuitionTotal * 0.15, y);
    if (deductions.studentLoanInterest > 0) y = drawAmountRow(page, fonts, 'Student Loan Interest Credit', deductions.studentLoanInterest * 0.15, y);

    y -= 5;
    y = drawAmountRow(page, fonts, 'TOTAL CREDITS', summary.totalCredits, y, true, false);

    // Final Calculation
    y -= 10;
    y = drawSectionHeader(page, fonts, 'FINAL CALCULATION', y, width);

    y = drawAmountRow(page, fonts, 'Total Federal + Provincial Tax', summary.federalTax + summary.provincialTax, y);
    y = drawAmountRow(page, fonts, 'Less: Total Credits', -summary.totalCredits, y);
    y = drawAmountRow(page, fonts, 'Net Tax Payable', summary.totalTax, y);
    y = drawAmountRow(page, fonts, 'Less: Tax Already Paid (Withheld)', -summary.totalPaid, y);

    y -= 10;
    y = drawAmountRow(page, fonts, isRefund ? 'REFUND' : 'BALANCE OWING', Math.abs(summary.refundOrOwing), y, true, isRefund);

    // Explanation box
    y -= 20;
    const explanationText = isRefund
      ? `You're receiving a refund because the tax withheld from your paycheques (${formatCurrency(summary.totalPaid)}) was more than the actual tax you owe (${formatCurrency(summary.totalTax)}). The CRA will return the difference to you.`
      : `You owe a balance because the tax withheld from your income (${formatCurrency(summary.totalPaid)}) was less than the actual tax calculated on your return (${formatCurrency(summary.totalTax)}). You'll need to pay the difference to the CRA.`;

    y = drawInfoBox(page, fonts, isRefund ? 'Why am I getting a refund?' : 'Why do I owe money?', explanationText, 50, y, width - 100, isRefund ? COLORS.accentLight : COLORS.warningLight, isRefund ? COLORS.accent : COLORS.warning);

    // ========== PAGE 3: Understanding Your Taxes ==========
    page = pdfDoc.addPage([612, 792]);
    y = height - 100;

    drawHeader(page, fonts, filing, 3, totalPages);

    page.drawText('Understanding Your Tax Return', {
      x: 50,
      y,
      size: 24,
      font: bold,
      color: COLORS.primary,
    });

    y -= 15;
    y = drawParagraph(page, regular, 'This guide explains the key concepts in your tax return and helps you understand how your refund or balance owing was calculated.', 50, y, width - 100, 10, COLORS.secondary);

    // What is a Tax Return?
    y -= 20;
    y = drawSectionHeader(page, fonts, 'WHAT IS A TAX RETURN?', y, width);
    y = drawParagraph(page, regular,
      'A tax return is an annual report you file with the Canada Revenue Agency (CRA) that summarizes your income, deductions, and credits for the year. Based on this information, the CRA determines whether you owe additional taxes or are entitled to a refund.',
      62, y, width - 124, 10, COLORS.secondary);

    // Key Terms Explained
    y -= 25;
    y = drawSectionHeader(page, fonts, 'KEY TERMS EXPLAINED', y, width);

    y = drawBulletPoint(page, fonts, 'Total Income: The sum of all money you earned during the year from employment, self-employment, investments, pensions, and other sources. This is reported on various T-slips you receive from employers, banks, and other payers.', 62, y, width - 130, 'Total Income:');

    y -= 8;
    y = drawBulletPoint(page, fonts, 'Deductions: Amounts subtracted from your total income before calculating tax. Common deductions include RRSP contributions, union dues, childcare expenses, and moving expenses. These reduce your taxable income.', 62, y, width - 130, 'Deductions:');

    y -= 8;
    y = drawBulletPoint(page, fonts, 'Taxable Income: Your total income minus deductions. This is the amount used to calculate your federal and provincial taxes.', 62, y, width - 130, 'Taxable Income:');

    y -= 8;
    y = drawBulletPoint(page, fonts, 'Tax Credits: Amounts that directly reduce the tax you owe (not your income). The Basic Personal Amount ensures everyone can earn a certain amount tax-free. Other credits reward behaviors like charitable giving or offset costs like medical expenses.', 62, y, width - 130, 'Tax Credits:');

    y -= 8;
    y = drawBulletPoint(page, fonts, 'Tax Withheld: The income tax your employer deducted from your paycheques throughout the year and sent to the CRA on your behalf. This appears in Box 22 of your T4 slip.', 62, y, width - 130, 'Tax Withheld:');

    y -= 8;
    y = drawBulletPoint(page, fonts, 'Refund vs. Balance Owing: If the tax withheld exceeds your actual tax liability, you get a refund. If it\'s less, you owe the difference.', 62, y, width - 130, 'Refund vs. Balance Owing:');

    // How Tax Brackets Work
    y -= 20;
    y = drawSectionHeader(page, fonts, 'HOW TAX BRACKETS WORK', y, width);
    y = drawParagraph(page, regular,
      'Canada uses a progressive tax system, meaning higher income is taxed at higher rates. However, a common misconception is that moving into a higher tax bracket means all your income is taxed at that rate. In reality, only the income within each bracket is taxed at that bracket\'s rate.',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    page.drawText('2024 Federal Tax Brackets:', { x: 62, y, size: 10, font: bold, color: COLORS.primary });
    y -= 18;

    const brackets = [
      ['$0 - $55,867', '15%'],
      ['$55,867 - $111,733', '20.5%'],
      ['$111,733 - $173,205', '26%'],
      ['$173,205 - $246,752', '29%'],
      ['Over $246,752', '33%'],
    ];

    for (const [range, rate] of brackets) {
      page.drawText(range, { x: 72, y, size: 9, font: regular, color: COLORS.secondary });
      page.drawText(rate, { x: 200, y, size: 9, font: bold, color: COLORS.primary });
      y -= 15;
    }

    y -= 10;
    y = drawParagraph(page, regular,
      'For example, if you earned $70,000, you\'d pay 15% on the first $55,867, and 20.5% only on the remaining $14,133. Your province also applies its own tax brackets on top of federal tax.',
      62, y, width - 124, 10, COLORS.secondary);

    // ========== PAGE 4: Your Tax Documents & What They Mean ==========
    page = pdfDoc.addPage([612, 792]);
    y = height - 100;

    drawHeader(page, fonts, filing, 4, totalPages);

    page.drawText('Your Tax Documents Explained', {
      x: 50,
      y,
      size: 24,
      font: bold,
      color: COLORS.primary,
    });

    y -= 40;
    y = drawSectionHeader(page, fonts, 'COMMON TAX SLIPS', y, width);

    // T4 Explanation
    page.drawText('T4 - Statement of Remuneration Paid', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Issued by your employer, this slip shows your employment income, tax deducted, CPP contributions, and EI premiums. Every employer you worked for in the tax year will issue a separate T4. Key boxes: Box 14 (employment income), Box 22 (income tax deducted), Box 16 (CPP contributions), Box 18 (EI premiums).',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    // T5 Explanation
    page.drawText('T5 - Statement of Investment Income', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Issued by banks and financial institutions for interest, dividends, and other investment income over $50. Canadian dividends receive preferential tax treatment through the dividend tax credit. Key boxes: Box 10 (actual dividends), Box 13 (interest from Canadian sources).',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    // T4A Explanation
    page.drawText('T4A - Statement of Pension and Other Income', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Reports income from pensions, retiring allowances, self-employed commissions, RESP educational assistance payments, and other income that doesn\'t fit on a T4. Common for freelancers paid more than $500 by a single payer.',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    // T4E Explanation
    page.drawText('T4E - Statement of Employment Insurance Benefits', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'If you received Employment Insurance (EI) benefits during the year, Service Canada issues this slip. EI benefits are taxable income. Box 14 shows total benefits, Box 22 shows tax deducted.',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    // RRSP Explanation
    page.drawText('RRSP Contribution Receipts', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Your financial institution provides receipts for RRSP contributions. Contributions made in the first 60 days of the year can be claimed on either the previous or current year\'s return. RRSP contributions directly reduce your taxable income.',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 25;
    y = drawSectionHeader(page, fonts, 'IMPORTANT DEADLINES', y, width);

    y = drawBulletPoint(page, fonts, 'April 30: Deadline to file your tax return and pay any balance owing for most individuals.', 62, y, width - 130, 'April 30:');
    y -= 5;
    y = drawBulletPoint(page, fonts, 'June 15: Extended filing deadline if you or your spouse/partner are self-employed. However, any balance owing is still due April 30.', 62, y, width - 130, 'June 15:');
    y -= 5;
    y = drawBulletPoint(page, fonts, 'First 60 days of the year: RRSP contributions during this period can be claimed on the previous year\'s return.', 62, y, width - 130, 'First 60 days:');

    y -= 25;
    y = drawSectionHeader(page, fonts, 'RECORD KEEPING', y, width);
    y = drawParagraph(page, regular,
      'Keep all tax documents, receipts, and records for at least 6 years after filing. The CRA can audit your return during this period and may ask you to provide supporting documentation. Digital copies are acceptable, but ensure they\'re legible and complete.',
      62, y, width - 124, 10, COLORS.secondary);

    // ========== PAGE 5: Next Steps & Resources ==========
    page = pdfDoc.addPage([612, 792]);
    y = height - 100;

    drawHeader(page, fonts, filing, 5, totalPages);

    page.drawText('Next Steps & Resources', {
      x: 50,
      y,
      size: 24,
      font: bold,
      color: COLORS.primary,
    });

    y -= 40;
    y = drawSectionHeader(page, fonts, 'HOW TO FILE YOUR RETURN', y, width);

    page.drawText('Option 1: NETFILE (Recommended)', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'File electronically through certified tax software like Taxxon. You\'ll receive immediate confirmation, and refunds are processed faster (typically within 2 weeks if you have direct deposit set up).',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    page.drawText('Option 2: CRA My Account', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Log in to your CRA My Account at canada.ca/my-cra-account. You can use the "File a Return" service to enter your tax information directly. This is free but requires manually entering all figures.',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 20;
    page.drawText('Option 3: Paper Filing', { x: 62, y, size: 11, font: bold, color: COLORS.primary });
    y -= 18;
    y = drawParagraph(page, regular,
      'Download the T1 General form from canada.ca, complete it by hand, and mail it to your tax centre. This is the slowest option—refunds can take 8+ weeks. Only recommended if you cannot file electronically.',
      62, y, width - 124, 10, COLORS.secondary);

    // What to expect after filing
    y -= 25;
    y = drawSectionHeader(page, fonts, 'WHAT TO EXPECT AFTER FILING', y, width);

    y = drawBulletPoint(page, fonts, 'Notice of Assessment (NOA): The CRA will mail you (and post to My Account) a Notice of Assessment within 2-8 weeks. This confirms your return was processed and shows any adjustments.', 62, y, width - 130, 'Notice of Assessment:');
    y -= 5;
    y = drawBulletPoint(page, fonts, 'Refund: If you\'re owed a refund and have direct deposit set up, expect it within 2 weeks of filing electronically. Cheques take longer.', 62, y, width - 130, 'Refund:');
    y -= 5;
    y = drawBulletPoint(page, fonts, 'Payment: If you owe money, you can pay through your bank, CRA My Account, or by mailing a cheque. Interest is charged on late payments at the prescribed rate.', 62, y, width - 130, 'Payment:');

    // If you made a mistake
    y -= 25;
    y = drawSectionHeader(page, fonts, 'IF YOU MADE A MISTAKE', y, width);
    y = drawParagraph(page, regular,
      'Don\'t worry—you can correct errors after filing. Wait until you receive your Notice of Assessment, then use the "Change my return" feature in CRA My Account, or file a T1 Adjustment Request (T1-ADJ form). You can request changes for the previous 10 tax years.',
      62, y, width - 124, 10, COLORS.secondary);

    // Benefits you may qualify for
    y -= 25;
    y = drawSectionHeader(page, fonts, 'BENEFITS YOU MAY QUALIFY FOR', y, width);
    y = drawParagraph(page, regular,
      'Filing your tax return, even if you have low or no income, is important because it determines your eligibility for benefits like:',
      62, y, width - 124, 10, COLORS.secondary);

    y -= 15;
    y = drawBulletPoint(page, fonts, 'GST/HST Credit - Quarterly payments to offset sales tax for low-income individuals', 62, y, width - 130);
    y = drawBulletPoint(page, fonts, 'Canada Child Benefit (CCB) - Monthly tax-free payments for families with children', 62, y, width - 130);
    y = drawBulletPoint(page, fonts, 'Provincial benefits - Many provinces offer additional credits and rebates', 62, y, width - 130);
    y = drawBulletPoint(page, fonts, 'RRSP contribution room - Calculated based on your earned income', 62, y, width - 130);

    // Resources box
    y -= 20;
    y = drawInfoBox(page, fonts, 'Helpful Resources',
      'CRA website: canada.ca/revenue-agency • CRA My Account: canada.ca/my-cra-account • Tax information phone line: 1-800-959-8281 • Forms and publications: canada.ca/taxes-forms-publications',
      50, y, width - 100, COLORS.infoLight, COLORS.info);

    // Footer disclaimer
    page.drawText(
      'This document is for informational purposes. Verify all information before filing. Tax laws change annually—consult the CRA or a tax professional for specific advice.',
      {
        x: 50,
        y: 75,
        size: 8,
        font: regular,
        color: COLORS.muted,
      }
    );

    page.drawText(
      `Generated by Taxxon • ${new Date().toISOString()}`,
      {
        x: 50,
        y: 63,
        size: 8,
        font: regular,
        color: COLORS.muted,
      }
    );

    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      pdfBytes,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}
