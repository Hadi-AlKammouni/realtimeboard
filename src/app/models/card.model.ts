export type ColumnId = 'todo' | 'progress' | 'done';

export interface Card {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  order: number;
  label: string;
  updatedAt: number;
  createdBy?: string;
}

export interface Presence {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
}

export const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const LABEL_COLORS: { name: string; value: string }[] = [
  { name: 'Blue', value: '#5B8DEF' },
  { name: 'Violet', value: '#7C5CFC' },
  { name: 'Green', value: '#3FB68B' },
  { name: 'Amber', value: '#E0A458' },
  { name: 'Rose', value: '#E0556E' },
  { name: 'Cyan', value: '#4FC3F7' },
];
