function linePriority(line: string): number {
  if (line === "tomy") return 0;
  if (line === "t_arts") return 1;
  return 2;
}

export function compareFigures(a: any, b: any): number {
  const numA = a?.pokemon?.pokedex_number ?? 0;
  const numB = b?.pokemon?.pokedex_number ?? 0;
  if (numA !== numB) return numA - numB;

  const lpA = linePriority(a?.line);
  const lpB = linePriority(b?.line);
  if (lpA !== lpB) return lpA - lpB;

  return (a?.visual_order ?? 0) - (b?.visual_order ?? 0);
}

export function sortFigures(figures: any[]): any[] {
  return [...figures].sort(compareFigures);
}
