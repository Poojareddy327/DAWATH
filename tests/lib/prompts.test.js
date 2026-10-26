// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SYSTEM_INSTRUCTION,
  buildChatPrompt,
  buildIdeasPrompt,
  buildPlanPrompt,
  buildRepairPrompt,
} from '../../src/lib/prompts.js';
import { ARJUN, PRIYA, TODAY } from '../fixtures/personas.js';

const spec = readFileSync(new URL('../../docs/PROMPT_SPEC.md', import.meta.url), 'utf8').replace(
  /\r\n/g,
  '\n',
);

/** Plain code blocks of PROMPT_SPEC: [0] §1, [1] §2, [2] §4, [3] §5 (§3 is a js block). */
const blocks = [...spec.matchAll(/```(\w*)\n([\s\S]*?)```/g)]
  .filter((m) => m[1] === '')
  .map((m) => m[2].trimEnd());

// Replace each {placeholder} in the spec with a regex wildcard, escape everything else.
const toPattern = (block) =>
  new RegExp(
    `^${block
      .split(/\{[^}\n]+\}/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[\\s\\S]*?')}$`,
  );

describe('prompts match docs/PROMPT_SPEC.md exactly', () => {
  it('system instruction (§1)', () => {
    expect(SYSTEM_INSTRUCTION).toBe(blocks[0]);
  });

  it('master plan prompt (§2)', () => {
    const prompt = buildPlanPrompt(PRIYA, { today: TODAY, daysLeft: 90 });
    expect(prompt).toMatch(toPattern(blocks[1]));
    expect(prompt).toContain('- Date: 2027-01-18 (90 days from today, 2026-10-20)');
    expect(prompt).toContain('- Total budget: ₹800000');
    expect(prompt).toContain('dueDaysBefore must be an integer between 0 and 90.');
  });

  it('fills optional fields with the spec defaults', () => {
    const prompt = buildPlanPrompt({ ...ARJUN, prefs: '' }, { today: TODAY, daysLeft: 21 });
    expect(prompt).toContain('- Culture/region: not specified');
    expect(prompt).toContain('- Preferences: none');
  });

  it('repair prompt (§4)', () => {
    const prompt = buildRepairPrompt('- tasks: Too small', '{"a":1}');
    expect(prompt).toMatch(toPattern(blocks[2]));
    expect(prompt).toContain('- tasks: Too small');
  });

  it('chat prompt (§5)', () => {
    const prompt = buildChatPrompt('EVENT: wedding', 'Plan B for rain');
    expect(prompt).toMatch(toPattern(blocks[3]));
    expect(prompt.endsWith('User: Plan B for rain')).toBe(true);
  });

  it('ideas prompt (§6)', () => {
    const prompt = buildIdeasPrompt(PRIYA, 'eco', ['A', 'B']);
    expect(prompt).toContain('Give fresh ideas for this event in a "eco" style');
    expect(prompt).toContain('Avoid repeating these titles: A; B.');
    expect(prompt).toContain('wedding on 2027-01-18 in Kochi, 300 guests, budget ₹8,00,000');
  });
});
