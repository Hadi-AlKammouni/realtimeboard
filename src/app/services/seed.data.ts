import { Card, LABEL_COLORS } from '../models/card.model';

const blue = LABEL_COLORS[0].value;
const violet = LABEL_COLORS[1].value;
const green = LABEL_COLORS[2].value;
const amber = LABEL_COLORS[3].value;
const rose = LABEL_COLORS[4].value;
const cyan = LABEL_COLORS[5].value;

/**
 * Believable demo data so visitors land on a non-empty board.
 * Loaded once when `/boards/{demoBoard}/cards` is empty.
 */
export const SEED_CARDS: Omit<Card, 'id' | 'updatedAt'>[] = [
  {
    title: 'Sketch the new presence avatars',
    description: 'Aim for 28px circles with -6px overlap. Initials only.',
    column: 'todo',
    order: 0,
    label: blue,
  },
  {
    title: 'Investigate flaky CI on Safari',
    description: 'Race condition between onAuth and the cards subscription.',
    column: 'todo',
    order: 1,
    label: rose,
  },
  {
    title: 'Move database rules to per-board scope',
    description: 'Allow anonymous read/write only on demoBoard, not the root.',
    column: 'todo',
    order: 2,
    label: amber,
  },
  {
    title: 'Wire drag-and-drop animations',
    description: 'CDK lift + scale 1.02. 150ms ease.',
    column: 'progress',
    order: 0,
    label: violet,
  },
  {
    title: 'Add connection-status pill',
    description: "Reflect onValue('.info/connected') in the top bar.",
    column: 'progress',
    order: 1,
    label: cyan,
  },
  {
    title: 'Ship anonymous auth on first load',
    description: 'No login friction — visitor lands on the live board.',
    column: 'done',
    order: 0,
    label: green,
  },
  {
    title: 'Set the 8px spacing grid',
    description: 'Token snippet applied across all three projects.',
    column: 'done',
    order: 1,
    label: blue,
  },
];
