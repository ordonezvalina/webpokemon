export const LINEAS = [
  { value: "moncolle", label: "Moncolle" },
  { value: "tomy-arts", label: "Tomy Arts" }
];

export const DEFAULT_LINEA = "tomy-arts";

export const ATRIBUTOS = [
  { value: "brillante", label: "Brillante / Pearl" },
  { value: "shiny", label: "Shiny / Variocolor" },
  { value: "clear", label: "Translucida / Clear" },
  { value: "mega", label: "Megaevolucion" },
  { value: "con-base", label: "Con Base / Peana / Diorama" }
];

export function normalizeLinea(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  if (normalized === "tomy-arts" || normalized === "tomyarts") {
    return "tomy-arts";
  }

  if (normalized === "moncolle") {
    return "moncolle";
  }

  return DEFAULT_LINEA;
}

export function getLineaLabel(value) {
  const linea = normalizeLinea(value);
  return LINEAS.find((entry) => entry.value === linea)?.label ?? linea;
}

export function getAtributoLabel(value) {
  return ATRIBUTOS.find((entry) => entry.value === value)?.label ?? value;
}

// Ahora es directo: si hay array de atributos, lo limpia; si no, devuelve array vacío
export function getFigureAtributos(figure) {
  return Array.isArray(figure?.atributos) ? figure.atributos.filter(Boolean) : [];
}

export function figureMatchesLineFilter(figure, lineFilter) {
  if (!lineFilter) {
    return true;
  }
  return normalizeLinea(figure?.linea) === lineFilter;
}

export function figureMatchesAtributoFilters(figure, selectedAtributos) {
  if (!selectedAtributos.length) {
    return true;
  }

  const figureAtributos = getFigureAtributos(figure);
  return selectedAtributos.every((atributo) => figureAtributos.includes(atributo));
}