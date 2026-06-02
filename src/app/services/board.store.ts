import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  child,
  DatabaseReference,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { environment } from '../../environments/environment';
import { Card, ColumnId, LABEL_COLORS, Presence } from '../models/card.model';
import { FirebaseService } from './firebase.service';
import { SEED_CARDS } from './seed.data';

const ANIMAL_NAMES = [
  'Otter',
  'Fox',
  'Heron',
  'Lynx',
  'Wren',
  'Marlin',
  'Falcon',
  'Sable',
  'Bison',
  'Crane',
  'Roe',
  'Tern',
  'Vole',
  'Ibis',
];

function randomName(): string {
  return ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
}

function randomColor(): string {
  const palette = LABEL_COLORS.map((l) => l.value);
  return palette[Math.floor(Math.random() * palette.length)];
}

/**
 * Single source of truth for the live board.
 *
 * - Subscribes to `/boards/{boardId}/cards` and `/presence` via Firebase RTDB.
 * - Exposes `cards()` and `presence()` as signals; components just read them.
 * - All mutations are **optimistic**: the local signal is updated immediately
 *   for a snappy UI, then the write goes to Firebase. When the server echoes
 *   the change back (a few ms later) the snapshot replaces local state. If
 *   Firebase is unreachable (e.g., offline / no creds), the optimistic update
 *   sticks — the UI is never blocked on the network.
 */
@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly firebase = inject(FirebaseService);

  private readonly _cards = signal<Card[]>([]);
  private readonly _presence = signal<Presence[]>([]);
  private readonly _connected = signal(true);
  private readonly _ready = signal(false);
  /** True once we've received at least one non-empty snapshot from RTDB. */
  private hasRemoteData = false;

  readonly cards = this._cards.asReadonly();
  readonly presence = this._presence.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly ready = this._ready.asReadonly();

  readonly cardsByColumn = computed<Record<ColumnId, Card[]>>(() => {
    const buckets: Record<ColumnId, Card[]> = { todo: [], progress: [], done: [] };
    for (const c of this._cards()) buckets[c.column].push(c);
    for (const id of Object.keys(buckets) as ColumnId[]) {
      buckets[id].sort((a, b) => a.order - b.order);
    }
    return buckets;
  });

  private readonly boardRef: DatabaseReference;
  private readonly cardsRef: DatabaseReference;
  private readonly presenceRef: DatabaseReference;
  private readonly connectedRef: DatabaseReference;

  private subscribed = false;

  constructor() {
    const { db } = this.firebase;
    this.boardRef = ref(db, `boards/${environment.boardId}`);
    this.cardsRef = child(this.boardRef, 'cards');
    this.presenceRef = child(this.boardRef, 'presence');
    this.connectedRef = ref(db, '.info/connected');

    // Defer RTDB subscriptions until we have an authenticated user. If we
    // subscribe earlier the rules return permission_denied and the listener
    // is closed for good — it does NOT auto-retry when auth later succeeds.
    effect(() => {
      const user = this.firebase.currentUser();
      if (user && !this.subscribed) {
        this.subscribed = true;
        this.subscribeCards();
        this.subscribeConnected();
        this.registerPresence();
      }
    });

    // Mark "ready" once auth has resolved, even if no user (offline mode).
    // The board renders an empty state in that case; mutations stay local.
    effect(() => {
      if (this.firebase.authReady() && !this.firebase.currentUser()) {
        this._ready.set(true);
      }
    });

    effect(() => {
      const user = this.firebase.currentUser();
      const ready = this._ready();
      const empty = this._cards().length === 0;
      if (user && ready && empty) this.seedIfEmpty();
    });
  }

  // ───────────────────────────── subscriptions ────────────────────────────

  private subscribeCards(): void {
    onValue(
      this.cardsRef,
      (snap) => {
        const value = snap.val() as Record<string, Omit<Card, 'id'>> | null;
        if (value) {
          this.hasRemoteData = true;
          const list: Card[] = Object.entries(value).map(([id, v]) => ({ id, ...v }));
          this._cards.set(list);
        } else if (this.hasRemoteData) {
          // Remote board went empty (rare — explicit clear). Reflect it.
          this._cards.set([]);
        }
        this._ready.set(true);
      },
      (err) => {
        console.warn('[BoardStore] cards subscription failed:', err.message);
        this._ready.set(true);
      },
    );

    onValue(this.presenceRef, (snap) => {
      const value = snap.val() as Record<string, Omit<Presence, 'id'>> | null;
      const cutoff = Date.now() - 60_000;
      const list: Presence[] = value
        ? Object.entries(value)
            .map(([id, v]) => ({ id, ...v }))
            .filter((p) => p.lastSeen > cutoff)
        : [];
      this._presence.set(list);
    });
  }

  private subscribeConnected(): void {
    onValue(this.connectedRef, (snap) => {
      this._connected.set(snap.val() === true);
    });
  }

  /**
   * Per-tab session presence. We key by a random session id (not the auth uid)
   * so two tabs in the same browser show up as two distinct presences — which
   * is what a viewer expects when they open the live demo in a second tab.
   */
  private registerPresence(): void {
    const sessionId = this.makeSessionId();
    const myPresence = child(this.presenceRef, sessionId);
    const data: Omit<Presence, 'id'> = {
      name: randomName(),
      color: randomColor(),
      lastSeen: Date.now(),
    };
    set(myPresence, data).catch(() => void 0);
    onDisconnect(myPresence)
      .remove()
      .catch(() => void 0);

    setInterval(() => {
      update(myPresence, { lastSeen: serverTimestamp() as unknown as number }).catch(() => void 0);
    }, 20_000);
  }

  private makeSessionId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return 's-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private seedAttempted = false;
  private async seedIfEmpty(): Promise<void> {
    if (this.seedAttempted) return;
    this.seedAttempted = true;
    // Generate IDs once and reuse them so the optimistic local copy and the
    // remote write end up with the same primary key (so the echo dedupes).
    const items = SEED_CARDS.map((c) => {
      const newRef = push(this.cardsRef);
      const id = newRef.key as string;
      const card: Card = { id, ...c, updatedAt: Date.now() };
      return { card, newRef };
    });
    this._cards.set([...this._cards(), ...items.map((i) => i.card)]);
    for (const { card, newRef } of items) {
      const { id, ...payload } = card;
      void id;
      set(newRef, payload).catch(() => void 0);
    }
  }

  // ─────────────────────────────── mutations ──────────────────────────────

  async addCard(input: {
    title: string;
    description?: string;
    column?: ColumnId;
    label?: string;
  }): Promise<void> {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) return;
    const column = input.column ?? 'todo';
    const order = this.nextOrder(column);
    const newRef = push(this.cardsRef);
    const id = newRef.key as string;
    const card: Card = {
      id,
      title: trimmedTitle,
      description: (input.description ?? '').trim(),
      column,
      order,
      label: input.label ?? LABEL_COLORS[0].value,
      updatedAt: Date.now(),
      createdBy: this.firebase.currentUser()?.uid,
    };
    // Optimistic: paint locally first.
    this._cards.set([...this._cards(), card]);
    const { id: _id, ...payload } = card;
    void _id;
    try {
      await set(newRef, payload);
    } catch (err) {
      console.warn('[BoardStore] addCard write failed (kept local copy):', err);
    }
  }

  async updateCard(id: string, patch: Partial<Omit<Card, 'id'>>): Promise<void> {
    const next = this._cards().map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
    );
    this._cards.set(next);
    try {
      await update(child(this.cardsRef, id), { ...patch, updatedAt: Date.now() });
    } catch (err) {
      console.warn('[BoardStore] updateCard write failed (kept local copy):', err);
    }
  }

  async deleteCard(id: string): Promise<void> {
    this._cards.set(this._cards().filter((c) => c.id !== id));
    try {
      await remove(child(this.cardsRef, id));
    } catch (err) {
      console.warn('[BoardStore] deleteCard write failed:', err);
    }
  }

  /**
   * Move a card to a new column at a specific index. Re-orders neighbours by
   * batch-writing a single `update()` so listeners see one consistent state.
   */
  async moveCard(cardId: string, toColumn: ColumnId, toIndex: number): Promise<void> {
    const all = this._cards();
    const moving = all.find((c) => c.id === cardId);
    if (!moving) return;

    const buckets: Record<ColumnId, Card[]> = { todo: [], progress: [], done: [] };
    for (const c of all) buckets[c.column].push({ ...c });
    for (const id of Object.keys(buckets) as ColumnId[]) {
      buckets[id].sort((a, b) => a.order - b.order);
    }

    buckets[moving.column] = buckets[moving.column].filter((c) => c.id !== cardId);
    const target = buckets[toColumn];
    const clamped = Math.max(0, Math.min(toIndex, target.length));
    const movedCopy: Card = { ...moving, column: toColumn, order: clamped };
    target.splice(clamped, 0, movedCopy);

    const updates: Record<string, unknown> = {};
    const nextLocal: Card[] = [];
    const affected = new Set<ColumnId>([moving.column, toColumn]);
    for (const col of Object.keys(buckets) as ColumnId[]) {
      buckets[col].forEach((c, i) => {
        const renumbered: Card = affected.has(col)
          ? { ...c, column: col, order: i, updatedAt: Date.now() }
          : c;
        nextLocal.push(renumbered);
        if (affected.has(col) && (c.order !== i || c.column !== col || c.id === cardId)) {
          updates[`${c.id}/order`] = i;
          updates[`${c.id}/column`] = col;
          updates[`${c.id}/updatedAt`] = renumbered.updatedAt;
        }
      });
    }

    this._cards.set(nextLocal);
    if (Object.keys(updates).length === 0) return;
    try {
      await update(this.cardsRef, updates);
    } catch (err) {
      console.warn('[BoardStore] moveCard write failed (kept local order):', err);
    }
  }

  private nextOrder(column: ColumnId): number {
    const inCol = this._cards().filter((c) => c.column === column);
    if (inCol.length === 0) return 0;
    return Math.max(...inCol.map((c) => c.order)) + 1;
  }
}
