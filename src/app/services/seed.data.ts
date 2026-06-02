import { Card, LABEL_COLORS } from '../models/card.model';

const blue = LABEL_COLORS[0].value;
const violet = LABEL_COLORS[1].value;
const green = LABEL_COLORS[2].value;
const rose = LABEL_COLORS[4].value;

/**
 * Believable demo data so visitors land on a non-empty board.
 * Loaded once when `/boards/{demoBoard}/cards` is empty.
 */
export const SEED_CARDS: Omit<Card, 'id' | 'updatedAt'>[] = [
  {
    title: 'Triage Stripe webhook retries for failed invoices',
    description: '4 retries timing out at the auth step since Friday. Pair with payments-on-call.',
    column: 'todo',
    order: 0,
    label: rose,
  },
  {
    title: 'Draft Q3 OKRs with engineering leads',
    description:
      'Aim for 3 outcome-level objectives; share rough cut by Thursday for the leads sync.',
    column: 'todo',
    order: 1,
    label: violet,
  },
  {
    title: 'Migrate auth provider to WorkOS',
    description:
      'Cutover plan reviewed; rolling out behind the `auth_v2` flag to 10% of orgs first.',
    column: 'progress',
    order: 0,
    label: blue,
  },
  {
    title: 'Customer call: Lumina enterprise renewal',
    description:
      'Renewal at risk over the SSO gap. Bring the WorkOS migration timeline to the call.',
    column: 'progress',
    order: 1,
    label: green,
  },
  {
    title: 'Ship usage-based billing for the Pro plan',
    description: 'Released to all Pro accounts on Monday; metering reconciled at midnight UTC.',
    column: 'done',
    order: 0,
    label: blue,
  },
];
