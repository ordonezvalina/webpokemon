// Canonical database values for the figures.line column.
// These values MUST match the PostgreSQL CHECK constraint in schema.sql:
//   CHECK (line IN ('tomy', 't_arts'))
// Do not rename these values without running a database migration first.
export const LINES = [
  { value: "tomy",   label: "Takara Tomy / Moncolle" },
  { value: "t_arts", label: "Takara Tomy Arts (T-Arts)" }
];

export const DEFAULT_LINE = "tomy";

export const ATTRIBUTES = [
  { value: "brillante", label: "Pearl / Brillante" },
  { value: "shiny", label: "Shiny / Variocolor" },
  { value: "clear", label: "Clear / Translucent" },
  { value: "con-base", label: "With Base / Diorama" }
];

// Compatibility layer: normalises any historical alias or external value
// to a canonical LINES value. The database CHECK constraint prevents new
// aliases from being persisted, but this function keeps the frontend
// resilient against legacy data, backups, or external imports.
export function normalizeLine(value) {
  const v = String(value ?? "").toLowerCase().trim();
  const ALIASES = {
    tomy:      "tomy",
    moncolle:  "tomy",
    t_arts:    "t_arts",
    "tomy-arts": "t_arts",
    tomy_arts: "t_arts",
    tomyarts:  "t_arts"
  };
  return ALIASES[v] ?? DEFAULT_LINE;
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