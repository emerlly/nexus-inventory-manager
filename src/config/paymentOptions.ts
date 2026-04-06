export const PAYMENT_METHODS = [
  { value: "Dinheiro", label: "Dinheiro", condition: "avista" },
  { value: "Pix", label: "Pix", condition: "avista" },
  { value: "Débito", label: "Cartão de Débito", condition: "avista" },
  { value: "Crédito à Vista", label: "Cartão de Crédito à Vista", condition: "avista" },
  { value: "Crédito Parcelado", label: "Cartão de Crédito Parcelado", condition: "prazo" },
  { value: "Boleto", label: "Boleto", condition: "prazo" },
  { value: "Transferência", label: "Transferência Bancária", condition: "avista" },
] as const;

export type PaymentCondition = "avista" | "prazo";

export const PAYMENT_CONDITIONS = [
  { value: "avista" as const, label: "À Vista" },
  { value: "prazo" as const, label: "A Prazo" },
];

/** Returns true if the selected method is always "à vista" */
export function isAvistaMethod(method: string): boolean {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found ? found.condition === "avista" : false;
}

/** Auto-detect condition based on selected method */
export function getConditionForMethod(method: string): PaymentCondition {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.condition === "prazo" ? "prazo" : "avista";
}
