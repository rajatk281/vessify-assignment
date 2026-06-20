export interface ExtractedTransaction {
  description: string;
  amount: number;
  date: Date;
  confidence: number;
}

export function extractTransaction(
  text: string
): ExtractedTransaction {
  let confidence = 0.5;

  // ===== DATE =====
  let date: Date | null = null;

  const isoDate = text.match(
    /\b\d{4}-\d{2}-\d{2}\b/
  );

  const slashDate = text.match(
    /\b\d{2}\/\d{2}\/\d{4}\b/
  );

  const longDate = text.match(
    /\b\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\b/
  );

  if (isoDate) {
    date = new Date(isoDate[0]);
    confidence += 0.15;
  } else if (slashDate) {
    const [day, month, year] =
      slashDate[0].split("/");

    date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    confidence += 0.15;
  } else if (longDate) {
    date = new Date(longDate[0]);
    confidence += 0.15;
  }

  // ===== AMOUNT =====

  let amount = 0;

  const amountMatch = text.match(
    /₹?\s?(-?[\d,]+\.\d{2})/
  );

  if (amountMatch) {
    amount = Number(
      amountMatch[1].replace(/,/g, "")
    );

    confidence += 0.2;
  }

  // ===== DESCRIPTION =====

  let description = "Unknown Transaction";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const descriptionLine = lines.find(
    (line) =>
      !line.includes("Date") &&
      !line.includes("Amount") &&
      !line.includes("Balance") &&
      !line.includes("debited")
  );

  if (descriptionLine) {
    description = descriptionLine;
    confidence += 0.15;
  }

  // confidence max 1

  confidence = Math.min(confidence, 1);

  return {
    description,
    amount,
    date: date ?? new Date(),
    confidence,
  };
}