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

// Ahora trabaja con las columnas booleanas de la BD (es_shiny, es_mega, es_clear, es_pearl, tiene_base)
export function getFigureAtributos(figure) {
  const atributos = [];
  
  if (figure?.es_shiny) atributos.push("shiny");
  if (figure?.es_mega) atributos.push("mega");
  if (figure?.es_clear) atributos.push("clear");
  if (figure?.es_pearl) atributos.push("brillante");
  if (figure?.tiene_base) atributos.push("con-base");
  
  return atributos;
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