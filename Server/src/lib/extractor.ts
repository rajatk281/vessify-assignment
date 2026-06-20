export interface ExtractedTransaction {
  description: string;
  amount: number;
  date: Date;
  confidence: number;
}

/**
 * Extracts structured transaction data from raw bank statement text.
 *
 * Handles multiple date formats:
 *   - ISO:    2025-12-10
 *   - Slash:  12/11/2025 (DD/MM/YYYY)
 *   - Long:   11 Dec 2025
 *
 * Handles amount patterns:
 *   - ₹2,999.00 / $49.99 / -420.00 / 1,250.00
 *
 * Confidence ranges from 0 to 1 based on how many fields were extracted.
 */
export function extractTransaction(text: string): ExtractedTransaction {
  let confidence = 0;
  let fieldsFound = 0;

  // ===== DATE EXTRACTION =====
  let date: Date | null = null;

  // ISO format: 2025-12-10
  const isoDate = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);

  // Slash format: 12/11/2025 (DD/MM/YYYY)
  const slashDate = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);

  // Long format: 11 Dec 2025
  const longDate = text.match(/\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/);

  if (isoDate) {
    date = new Date(isoDate[1]);
    fieldsFound++;
  } else if (slashDate) {
    const [day, month, year] = slashDate[1].split("/");
    date = new Date(Number(year), Number(month) - 1, Number(day));
    fieldsFound++;
  } else if (longDate) {
    date = new Date(longDate[1]);
    fieldsFound++;
  }

  // ===== AMOUNT EXTRACTION =====
  let amount = 0;

  // Match currency amounts: ₹2,999.00, $49.99, -420.00, 1,250.00
  // Handles: ₹ / $ prefix, optional negative sign, commas, decimals
  const amountPatterns = [
    /[₹$]\s?(-?[\d,]+\.?\d*)/,           // ₹2,999.00 or $49.99
    /Amount:\s*-?\s*[₹$]?\s*([\d,]+\.?\d*)/, // Amount: -420.00
    /(-?[\d,]+\.\d{2})\s*(?:debited|credited|Dr|Cr)/i, // 1,250.00 debited
    /[₹$]?\s*(-?[\d,]+\.\d{2})/,          // fallback: any decimal number
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = Math.abs(Number(match[1].replace(/,/g, "")));
      fieldsFound++;
      break;
    }
  }

  // ===== DESCRIPTION EXTRACTION =====
  let description = "Unknown Transaction";

  // Noise keywords to filter out from description lines
  const noisePatterns = [
    /^\s*Date\s*:/i,
    /^\s*Amount\s*:/i,
    /Balance/i,
    /Available\s+Balance/i,
    /debited/i,
    /credited/i,
    /^\s*Bal\b/i,
    /^txn\d+\s/i,  // transaction ID prefix – extract from it instead
  ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Special handling for single-line messy statements (Sample 3)
  if (lines.length === 1) {
    const line = lines[0];

    // Try to extract description from messy single-line format
    // Pattern: txnID DATE Merchant Order# AMOUNT Dr/Cr Bal BALANCE Category
    const merchantMatch = line.match(
      /\d{4}-\d{2}-\d{2}\s+(.+?)\s+[₹$]?[\d,]+\.?\d*\s*(?:Dr|Cr)\b/i
    );
    if (merchantMatch) {
      description = merchantMatch[1].trim();
      fieldsFound++;
    } else {
      // Fallback: remove date, amounts, known noise, and take what's left
      let cleaned = line
        .replace(/txn\w+/gi, "")
        .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
        .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, "")
        .replace(/[₹$]\s?[\d,]+\.?\d*/g, "")
        .replace(/\b[\d,]+\.\d{2}\b/g, "")
        .replace(/\b(Dr|Cr|Bal|debited|credited|Shopping|Groceries|Food|Transport)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length > 2) {
        description = cleaned;
        fieldsFound++;
      }
    }
  } else {
    // Multi-line: find the most descriptive line
    // Priority: line with "Description:" label, then first non-noise line
    const labelledDesc = text.match(/Description:\s*(.+)/i);
    if (labelledDesc) {
      description = labelledDesc[1].trim();
      fieldsFound++;
    } else {
      const descLine = lines.find(
        (line) => !noisePatterns.some((p) => p.test(line))
      );
      if (descLine) {
        // Clean up the description line – remove dates, amounts, arrows
        let cleaned = descLine
          .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
          .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, "")
          .replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, "")
          .replace(/[₹$]\s?[\d,]+\.?\d*/g, "")
          .replace(/→/g, "")
          .replace(/\*/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (cleaned.length > 2) {
          description = cleaned;
        } else {
          description = descLine;
        }
        fieldsFound++;
      }
    }
  }

  // ===== CONFIDENCE CALCULATION =====
  // 3 fields total (date, amount, description) → each contributes ~0.33
  confidence = Math.round((fieldsFound / 3) * 100) / 100;
  // Boost if all 3 found
  if (fieldsFound === 3) confidence = 1.0;

  return {
    description,
    amount,
    date: date ?? new Date(),
    confidence,
  };
}