/** "Book the Venue!" → "book-the-venue" (max 40 chars). */
export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '') || 'item'
  );
}

/** `base`, or `base-2`, `base-3`… — whichever is not already in `taken` (a Set). */
export function uniqueId(base, taken) {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Make every item's id unique and kebab-case, keeping the first occurrence unchanged. */
export function dedupeIds(items) {
  const taken = new Set();
  return items.map((item) => {
    const id = uniqueId(slugify(item.id), taken);
    taken.add(id);
    return id === item.id ? item : { ...item, id };
  });
}
