import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CardComponent } from '../card/card.component';
import { Card, ColumnId } from '../../models/card.model';
import { BoardStore } from '../../services/board.store';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CardComponent],
  templateUrl: './column.component.html',
  styleUrl: './column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnComponent {
  private readonly store = inject(BoardStore);

  @Input({ required: true }) id!: ColumnId;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) cards: Card[] = [];
  @Input() connectedListIds: string[] = [];

  @Output() addCard = new EventEmitter<ColumnId>();
  @Output() editCard = new EventEmitter<Card>();
  @Output() removeCard = new EventEmitter<Card>();

  get listId(): string {
    return 'column-' + this.id;
  }

  trackById = (_: number, c: Card) => c.id;

  async onDrop(event: CdkDragDrop<Card[]>): Promise<void> {
    const card = event.item.data as Card;
    const toCol = this.id;
    await this.store.moveCard(card.id, toCol, event.currentIndex);
  }
}
