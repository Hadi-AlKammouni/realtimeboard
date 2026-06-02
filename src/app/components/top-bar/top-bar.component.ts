import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { PresenceComponent } from '../presence/presence.component';
import { BoardStore } from '../../services/board.store';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [PresenceComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  private readonly store = inject(BoardStore);

  readonly connected = this.store.connected;

  @Output() add = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
}
