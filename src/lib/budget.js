/** Round non-negative weights to integers that sum exactly to `total` (largest remainder). */
export function apportion(weights, total) {
  if (weights.length === 0) return [];
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  const exact = sum > 0 ? safe.map((w) => (w / sum) * total) : safe.map(() => total / safe.length);
  const result = exact.map(Math.floor);
  let rest = total - result.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (rest <= 0) break;
    result[i] += 1;
    rest -= 1;
  }
  return result;
}

/** Normalize category percents to integers summing to exactly 100. */
export function normalizePercents(categories) {
  const percents = apportion(
    categories.map((c) => c.percent),
    100,
  );
  return categories.map((c, i) => ({ ...c, percent: percents[i] }));
}

/** Set one category's percent and scale the others proportionally so the total stays 100. */
export function rebalancePercents(categories, id, newPercent) {
  if (!categories.some((c) => c.id === id)) return categories;
  if (categories.length === 1) return categories.map((c) => ({ ...c, percent: 100 }));

  const value = Math.min(100, Math.max(0, Math.round(Number(newPercent) || 0)));
  const others = categories.filter((c) => c.id !== id);
  const scaled = apportion(
    others.map((c) => c.percent),
    100 - value,
  );
  let k = 0;
  return categories.map((c) =>
    c.id === id ? { ...c, percent: value } : { ...c, percent: scaled[k++] },
  );
}

/** ₹ allocated to a category. Always computed by us, never trusted from the model. */
export function categoryAmount(total, percent) {
  return Math.round((total * percent) / 100);
}

export function spentByCategory(expenses) {
  const totals = {};
  for (const e of expenses) totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount;
  return totals;
}

/** Categories enriched with allocated / spent / remaining / overspent. */
export function budgetBreakdown(total, categories, expenses) {
  const spent = spentByCategory(expenses);
  return categories.map((c) => {
    const allocated = categoryAmount(total, c.percent);
    const used = spent[c.id] ?? 0;
    return {
      ...c,
      allocated,
      spent: used,
      remaining: allocated - used,
      overspent: used > allocated,
    };
  });
}

export function budgetTotals(total, categories, expenses) {
  const rows = budgetBreakdown(total, categories, expenses);
  const spent = rows.reduce((a, r) => a + r.spent, 0);
  return {
    total,
    spent,
    remaining: total - spent,
    overTotal: spent > total,
    overCategories: rows.filter((r) => r.overspent),
  };
}

/** `part` as a 0–100 share of `whole`, capped at 100 for progress bars. */
export function progressPercent(part, whole) {
  if (!whole || whole <= 0) return part > 0 ? 100 : 0;
  return Math.min(100, Math.round((part / whole) * 100));
}
