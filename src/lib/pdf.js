// jsPDF budget summary (PRD FR-8). jsPDF is loaded on demand so it never weighs down first paint.
import { budgetBreakdown, budgetTotals } from './budget.js';
import { EVENT_TYPES } from './constants.js';
import { formatDate, formatINRAscii } from './format.js';

/** Pure: the rows and headline figures that go into the PDF. */
export function buildBudgetSummary(event) {
  const { meta, plan, expenses } = event;
  const rows = budgetBreakdown(meta.budget, plan.budget.categories, expenses);
  const totals = budgetTotals(meta.budget, plan.budget.categories, expenses);
  const type = EVENT_TYPES.find((t) => t.value === meta.type)?.label ?? meta.type;
  return {
    title: `${type} in ${meta.city} — ${formatDate(meta.date)}`,
    subtitle: `${meta.guests} guests · Total budget ${formatINRAscii(meta.budget)}`,
    rows: rows.map((r) => [
      r.name,
      `${r.percent}%`,
      formatINRAscii(r.allocated),
      formatINRAscii(r.spent),
      formatINRAscii(r.remaining),
    ]),
    totals: [
      'Total',
      '100%',
      formatINRAscii(totals.total),
      formatINRAscii(totals.spent),
      formatINRAscii(totals.remaining),
    ],
    expenses: [...expenses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [
        formatDate(e.date),
        rows.find((r) => r.id === e.categoryId)?.name ?? '',
        e.label,
        formatINRAscii(e.amount),
      ]),
    overspent: totals.overTotal || totals.overCategories.length > 0,
  };
}

export async function downloadBudgetPdf(event) {
  const { jsPDF } = await import('jspdf');
  const s = buildBudgetSummary(event);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 40;
  let y = 56;

  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(136, 19, 55);
  doc.text('Utsav - Budget summary', left, y);
  y += 22;
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(40, 40, 40);
  doc.text(s.title, left, y);
  y += 16;
  doc.text(s.subtitle, left, y);
  y += 26;

  const cols = [left, 230, 290, 390, 480];
  const row = (cells, bold = false) => {
    if (y > 790) {
      doc.addPage();
      y = 56;
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    cells.forEach((cell, i) => doc.text(String(cell), cols[i], y));
    y += 18;
  };

  row(['Category', 'Share', 'Allocated', 'Spent', 'Remaining'], true);
  doc.setDrawColor(200).line(left, y - 12, 555, y - 12);
  s.rows.forEach((r) => row(r));
  doc.line(left, y - 12, 555, y - 12);
  row(s.totals, true);

  if (s.overspent) {
    y += 6;
    doc.setTextColor(185, 28, 28);
    row(['Warning: spending is over budget in at least one category.'], true);
    doc.setTextColor(40, 40, 40);
  }

  if (s.expenses.length) {
    y += 14;
    doc.setFontSize(13);
    row(['Expenses'], true);
    doc.setFontSize(10);
    const expenseCols = [left, 120, 250, 480];
    s.expenses.forEach((cells) => {
      if (y > 790) {
        doc.addPage();
        y = 56;
      }
      cells.forEach((cell, i) => doc.text(String(cell).slice(0, 40), expenseCols[i], y));
      y += 16;
    });
  }

  doc.save('utsav-budget.pdf');
}
