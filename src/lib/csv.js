import { budgetBreakdown, budgetTotals } from './budget.js';
import { formatDate } from './format.js';
import { VENDOR_STATUS_LABELS } from './constants.js';

function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Builds a structured CSV spreadsheet of the budget allocation and expense ledger.
 * @param {object} event
 * @returns {string} CSV content
 */
export function buildBudgetLedgerCsv(event) {
  const { meta, plan, expenses } = event;
  const rows = budgetBreakdown(meta.budget, plan.budget.categories, expenses);
  const totals = budgetTotals(meta.budget, plan.budget.categories, expenses);

  const lines = [
    ['Event', meta.culture ? `${meta.culture} ${meta.type}` : meta.type],
    ['City', meta.city],
    ['Date', formatDate(meta.date)],
    ['Guests', meta.guests],
    ['Total Budget', totals.total],
    ['Total Spent', totals.spent],
    ['Remaining', totals.remaining],
    [],
    ['=== BUDGET CATEGORY MATRIX ==='],
    ['Category', 'Share %', 'Allocated (INR)', 'Spent (INR)', 'Remaining (INR)', 'Status'],
  ];

  for (const r of rows) {
    const rem = Math.max(0, r.allocated - r.spent);
    const status = r.overspent ? 'OVER BUDGET' : rem === 0 ? 'FULLY UTENSILED' : 'HEALTHY';
    lines.push([r.name, `${r.percent}%`, r.allocated, r.spent, rem, status]);
  }

  lines.push([]);
  lines.push(['=== DETAILED EXPENSE LEDGER ===']);
  lines.push(['Expense ID', 'Date', 'Category', 'Description', 'Amount (INR)']);

  const catMap = Object.fromEntries(plan.budget.categories.map((c) => [c.id, c.name]));
  for (const exp of expenses) {
    lines.push([
      exp.id,
      formatDate(exp.date),
      catMap[exp.categoryId] ?? exp.categoryId,
      exp.item,
      exp.amount,
    ]);
  }

  return lines.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

/**
 * Builds a CSV of the vendor contacts and booking pipeline.
 * @param {object} event
 * @returns {string} CSV content
 */
export function buildVendorsCsv(event) {
  const { meta, plan, state } = event;
  const lines = [
    ['Celebration', meta.culture ? `${meta.culture} ${meta.type}` : meta.type],
    ['City', meta.city],
    ['Date', formatDate(meta.date)],
    [],
    ['=== VENDOR CONTACTS & BOOKING DIRECTORY ==='],
    ['Vendor Type', 'Category', 'Priority', 'Est Cost (INR)', 'Status', 'Contact / Phone', 'Notes'],
  ];

  for (const v of plan.vendors) {
    const statusKey = state.vendorStatus[v.id] ?? 'to-contact';
    const statusLabel = VENDOR_STATUS_LABELS[statusKey] ?? statusKey;
    const contact = state.vendorContacts[v.id] ?? '';
    lines.push([v.type, v.category, v.priority, v.estCost, statusLabel, contact, v.notes ?? '']);
  }

  return lines.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

/**
 * Triggers a browser download of CSV content with UTF-8 BOM.
 */
export function downloadCsvFile(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
