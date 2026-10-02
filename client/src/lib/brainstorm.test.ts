import { expect, it } from 'vitest';
import { BRAINSTORM_MODES } from '../api/types';
import { MODE_INFO, pickDifferent, THINKING_PROMPTS } from './brainstorm';

it('every brainstorm mode has a label and description', () => {
  for (const mode of BRAINSTORM_MODES) {
    expect(MODE_INFO[mode].label).toBeTruthy();
    expect(MODE_INFO[mode].description).toBeTruthy();
  }
});

it('pickDifferent never repeats the current item when it can avoid it', () => {
  for (let i = 0; i < 50; i++) {
    const current = THINKING_PROMPTS[i % THINKING_PROMPTS.length];
    expect(pickDifferent(THINKING_PROMPTS, current)).not.toBe(current);
  }
  expect(pickDifferent(['only'], 'only')).toBe('only');
  expect(pickDifferent(['a', 'b', 'c'], undefined, () => 0.99)).toBe('c');
});
