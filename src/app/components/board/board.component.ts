import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ColumnComponent } from '../column/column.component';
import { CardEditorComponent, CardEditorResult } from '../card-editor/card-editor.component';
import { BoardStore } from '../../services/board.store';
import { Card, COLUMNS, ColumnId } from '../../models/card.model';

interface EditorState {
  mode: 'add' | 'edit';
  initial: Partial<Card>;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ColumnComponent, CardEditorComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private readonly store = inject(BoardStore);

  readonly columns = COLUMNS;
  readonly cardsByColumn = this.store.cardsByColumn;
  readonly ready = this.store.ready;
  readonly connectedListIds = computed(() => this.columns.map((c) => 'column-' + c.id));

  readonly editor = signal<EditorState | null>(null);

  openAdd(column: ColumnId = 'todo'): void {
    this.editor.set({ mode: 'add', initial: { column } });
  }

  openEdit(card: Card): void {
    this.editor.set({ mode: 'edit', initial: card });
  }

  closeEditor(): void {
    this.editor.set(null);
  }

  async save(result: CardEditorResult): Promise<void> {
    const state = this.editor();
    if (!state) return;
    if (state.mode === 'add') {
      await this.store.addCard(result);
    } else if (state.initial.id) {
      await this.store.updateCard(state.initial.id, result);
    }
    this.editor.set(null);
  }

  async remove(card: Card): Promise<void> {
    await this.store.deleteCard(card.id);
  }
}
