// Pure event-state reducer. Shape follows PRD §6; persisted by storage.js.
import { rebalancePercents } from './budget.js';
import { phaseFor } from './dates.js';
import { slugify, uniqueId } from './ids.js';
import { sanitizeUpdates } from './schema.js';

export function createEvent(meta, plan, createdAt) {
  return {
    version: 1,
    meta: { ...meta, createdAt },
    plan,
    state: { doneTaskIds: [], vendorStatus: {}, vendorContacts: {}, styleSeed: 'traditional' },
    expenses: [],
    chat: [],
  };
}

const idsOf = (items) => new Set(items.map((i) => i.id));

const withPlan = (event, changes) => ({ ...event, plan: { ...event.plan, ...changes } });
const withState = (event, changes) => ({ ...event, state: { ...event.state, ...changes } });

export function addTask(event, task) {
  const id = uniqueId(`task-${slugify(task.title)}`, idsOf(event.plan.tasks));
  const next = { id, ...task, phase: phaseFor(task.dueDaysBefore) };
  return withPlan(event, { tasks: [...event.plan.tasks, next] });
}

export function addVendor(event, vendor) {
  const id = uniqueId(`ven-${slugify(vendor.type)}`, idsOf(event.plan.vendors));
  const next = { priority: 'nice-to-have', ...vendor, id, estCost: Math.round(vendor.estCost) };
  return withPlan(event, { vendors: [...event.plan.vendors, next] });
}

export function addIdea(event, { section, title, description, whyItFits }) {
  const list = event.plan.ideas[section];
  if (!list) return event;
  return withPlan(event, {
    ideas: { ...event.plan.ideas, [section]: [...list, { title, description, whyItFits }] },
  });
}

/** Apply one validated chat update (PROMPT_SPEC §5). Unknown ops / targets are no-ops. */
export function applyUpdate(event, update) {
  const [valid] = sanitizeUpdates([update]);
  if (!valid) return event;
  switch (valid.op) {
    case 'set_budget_percent': {
      const { categories } = event.plan.budget;
      if (!categories.some((c) => c.id === valid.categoryId)) return event;
      return withPlan(event, {
        budget: { categories: rebalancePercents(categories, valid.categoryId, valid.percent) },
      });
    }
    case 'add_task': {
      const { op: _op, ...task } = valid;
      return addTask(event, task);
    }
    case 'add_vendor': {
      const { op: _op, ...vendor } = valid;
      return addVendor(event, vendor);
    }
    case 'set_vendor_status':
      if (!event.plan.vendors.some((v) => v.id === valid.vendorId)) return event;
      return withState(event, {
        vendorStatus: { ...event.state.vendorStatus, [valid.vendorId]: valid.status },
      });
    case 'add_idea':
      return addIdea(event, valid);
    default:
      return event;
  }
}

function nextExpenseId(expenses) {
  const max = expenses.reduce((m, e) => Math.max(m, Number(e.id.replace('exp-', '')) || 0), 0);
  return `exp-${max + 1}`;
}

export function eventReducer(event, action) {
  if (action.type === 'event/created') return action.event;
  if (action.type === 'event/reset') return null;
  if (!event) return event;

  switch (action.type) {
    case 'budget/setPercent':
      return withPlan(event, {
        budget: {
          categories: rebalancePercents(event.plan.budget.categories, action.id, action.percent),
        },
      });

    case 'expense/add':
      return {
        ...event,
        expenses: [...event.expenses, { ...action.expense, id: nextExpenseId(event.expenses) }],
      };
    case 'expense/update':
      return {
        ...event,
        expenses: event.expenses.map((e) => (e.id === action.id ? { ...e, ...action.changes } : e)),
      };
    case 'expense/remove':
      return { ...event, expenses: event.expenses.filter((e) => e.id !== action.id) };

    case 'task/toggle': {
      const done = new Set(event.state.doneTaskIds);
      if (done.has(action.id)) done.delete(action.id);
      else done.add(action.id);
      return withState(event, { doneTaskIds: [...done] });
    }
    case 'task/add':
      return addTask(event, action.task);
    case 'task/update':
      return withPlan(event, {
        tasks: event.plan.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                ...action.changes,
                phase: phaseFor(action.changes.dueDaysBefore ?? t.dueDaysBefore),
              }
            : t,
        ),
      });
    case 'task/remove':
      return {
        ...withPlan(event, { tasks: event.plan.tasks.filter((t) => t.id !== action.id) }),
        state: {
          ...event.state,
          doneTaskIds: event.state.doneTaskIds.filter((id) => id !== action.id),
        },
      };

    case 'vendor/setStatus':
      return withState(event, {
        vendorStatus: { ...event.state.vendorStatus, [action.id]: action.status },
      });
    case 'vendor/setContact':
      return withState(event, {
        vendorContacts: { ...event.state.vendorContacts, [action.id]: action.contact },
      });
    case 'vendor/add':
      return addVendor(event, action.vendor);

    case 'ideas/replace':
      return withState(withPlan(event, { ideas: action.ideas }), { styleSeed: action.styleSeed });

    case 'chat/add':
      return { ...event, chat: [...event.chat, action.message].slice(-50) };
    case 'chat/resolveUpdate': {
      const message = event.chat[action.messageIndex];
      const update = message?.updates?.[action.updateIndex];
      if (!update || update.status !== 'pending') return event;
      const base = action.apply ? applyUpdate(event, update.data) : event;
      const chat = event.chat.map((m, i) =>
        i !== action.messageIndex
          ? m
          : {
              ...m,
              updates: m.updates.map((u, j) =>
                j === action.updateIndex
                  ? { ...u, status: action.apply ? 'applied' : 'dismissed' }
                  : u,
              ),
            },
      );
      return { ...base, chat };
    }

    default:
      return event;
  }
}
