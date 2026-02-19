import { describe, expect, it } from "vitest";

import { assertValidReceiptFile, type UpsertExpenseInput, validateExpenseInput } from "@/src/lib/expense-validation";

function makeInput(overrides: Partial<UpsertExpenseInput> = {}): UpsertExpenseInput {
  return {
    amount: "12.50",
    expenseDate: "2026-02-19",
    category: "Transport",
    paymentMethod: "personal_card",
    comment: "Taxi",
    ...overrides,
  };
}

describe("expense input validation", () => {
  it("normalizes valid payload", () => {
    const payload = validateExpenseInput(makeInput());

    expect(payload.amountMinor).toBe(1250);
    expect(payload.category).toBe("Transport");
    expect(payload.paymentMethod).toBe("personal_card");
  });

  it("rejects invalid amount", () => {
    expect(() => validateExpenseInput(makeInput({ amount: "0" }))).toThrow("Amount must be greater than 0.");
  });

  it("rejects invalid payment method", () => {
    expect(() => validateExpenseInput(makeInput({ paymentMethod: "cash" }))).toThrow(
      "Payment method must be work_card or personal_card.",
    );
  });
});

describe("receipt validation", () => {
  it("accepts supported receipt", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "receipt.pdf", { type: "application/pdf" });
    expect(() => assertValidReceiptFile(file)).not.toThrow();
  });

  it("rejects unsupported receipt type", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "receipt.gif", { type: "image/gif" });
    expect(() => assertValidReceiptFile(file)).toThrow("Receipt must be JPG, PNG, or PDF.");
  });
});
