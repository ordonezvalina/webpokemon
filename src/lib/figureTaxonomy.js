export const LINEAS = [
  { value: "tomy", label: "Takara Tomy / Moncolle" },
  { value: "t_arts", label: "Takara Tomy Arts (T-Arts)" }
];

export const DEFAULT_LINEA = "tomy";

export const ATRIBUTOS = [
  { value: "brillante", label: "Brillante / Pearl" },
  { value: "shiny", label: "Shiny / Variocolor" },
  { value: "clear", label: "Translucida / Clear" },
  { value: "con-base", label: "Con Base / Peana / Diorama" }
];

export function normalizeLinea(value) {
  const normalized = String(value ?? "").toLowerCase().trim();

  if (normalized === "tomy" || normalized === "moncolle") {
    return "tomy";
  }

  if (normalized === "t_arts" || normalized === "tomy-arts" || normalized === "tomyarts") {
    return "t_arts";
  }

  return DEFAULT_LINEA;
}

export function getLineaLabel(value) {
  const normalized = normalizeLinea(value);
  const entry = LINEAS.find((e) => e.value === normalized);
  return entry?.label ?? "Otras Líneas";
}

export function getAtributoLabel(value) {
  return ATRIBUTOS.find((entry) => entry.value === value)?.label ?? value;
}

// Trabaja con las columnas booleanas de la BD (is_shiny, is_clear, is_pearl, has_base)
export function getFigureAtributos(figure) {
  const atributos = [];

  if (figure?.is_shiny) atributos.push("shiny");
  if (figure?.is_clear) atributos.push("clear");
  if (figure?.is_pearl) atributos.push("brillante");
  if (figure?.has_base) atributos.push("con-base");

  return atributos;
}

export function figureMatchesLineFilter(figure, lineFilter) {
  if (!lineFilter) {
    return true;
  }
  return normalizeLinea(figure?.line) === lineFilter;
}

export function figureMatchesAtributoFilters(figure, selectedAtributos) {
  if (!selectedAtributos.length) {
    return true;
  }

  const figureAtributos = getFigureAtributos(figure);
  return selectedAtributos.every((atributo) => figureAtributos.includes(atributo));
}