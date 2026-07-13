export const LINES = [
  { value: "tomy", label: "Takara Tomy / Moncolle" },
  { value: "t_arts", label: "Takara Tomy Arts (T-Arts)" }
];

export const DEFAULT_LINE = "tomy";

export const ATTRIBUTES = [
  { value: "brillante", label: "Pearl / Brillante" },
  { value: "shiny", label: "Shiny / Variocolor" },
  { value: "clear", label: "Clear / Translucent" },
  { value: "con-base", label: "With Base / Diorama" }
];

export function normalizeLine(value) {
  const normalized = String(value ?? "").toLowerCase().trim();

  if (normalized === "tomy" || normalized === "moncolle") {
    return "tomy";
  }

  if (normalized === "t_arts" || normalized === "tomy-arts" || normalized === "tomyarts") {
    return "t_arts";
  }

  return DEFAULT_LINE;
}

export function getLineLabel(value) {
  const normalized = normalizeLine(value);
  const entry = LINES.find((e) => e.value === normalized);
  return entry?.label ?? "Other Lines";
}

export function getAttributeLabel(value) {
  return ATTRIBUTES.find((entry) => entry.value === value)?.label ?? value;
}

// Works with boolean columns from the DB (is_shiny, is_clear, is_pearl, has_base)
export function getFigureAttributes(figure) {
  const attributes = [];

  if (figure?.is_shiny) attributes.push("shiny");
  if (figure?.is_clear) attributes.push("clear");
  if (figure?.is_pearl) attributes.push("brillante");
  if (figure?.has_base) attributes.push("con-base");

  return attributes;
}

export function figureMatchesLineFilter(figure, lineFilter) {
  if (!lineFilter) {
    return true;
  }
  return normalizeLine(figure?.line) === lineFilter;
}

export function figureMatchesAttributeFilters(figure, selectedAttributes) {
  if (!selectedAttributes.length) {
    return true;
  }

  const figureAttributes = getFigureAttributes(figure);
  return selectedAttributes.every((attribute) => figureAttributes.includes(attribute));
}