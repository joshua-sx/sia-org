/** Minimal RFC4180-ish CSV parser. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  const push = () => { row.push(field); field = ""; };
  const endRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { push(); i++; continue; }
    if (c === "\n" || c === "\r") {
      push(); endRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
      i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { push(); endRow(); }
  return rows.filter((r) => r.some((v) => v.trim().length > 0));
}
