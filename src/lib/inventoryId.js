export function formatInventoryId(numPokedex, sequence) {
  return `${String(numPokedex).padStart(4, "0")}${String(sequence).padStart(3, "0")}`;
}

export function parseInventorySequence(id, numPokedex) {
  const prefix = String(numPokedex).padStart(4, "0");
  const idStr = String(id ?? "");

  if (!idStr.startsWith(prefix) || idStr.length !== 7) {
    return null;
  }

  const sequence = Number.parseInt(idStr.slice(4), 10);
  return Number.isFinite(sequence) ? sequence : null;
}

export function getNextInventorySequence(existingIds, numPokedex) {
  const sequences = existingIds
    .map((id) => parseInventorySequence(id, numPokedex))
    .filter((sequence) => sequence !== null);

  return sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
}

export function buildNextInventoryId(existingIds, numPokedex) {
  return formatInventoryId(numPokedex, getNextInventorySequence(existingIds, numPokedex));
}
