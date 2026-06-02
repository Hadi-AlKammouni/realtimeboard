import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[attr.data-card-id]': 'card.id',
    '[style.--label]': 'card.label',
  },
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
  @Output() edit = new EventEmitter<Card>();
  @Output() remove = new EventEmitter<Card>();
}
