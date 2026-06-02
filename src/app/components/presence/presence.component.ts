import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BoardStore } from '../../services/board.store';

@Component({
  selector: 'app-presence',
  standalone: true,
  templateUrl: './presence.component.html',
  styleUrl: './presence.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenceComponent {
  private readonly store = inject(BoardStore);

  readonly users = this.store.presence;

  readonly visible = computed(() => this.users().slice(0, 5));
  readonly overflow = computed(() => Math.max(0, this.users().length - 5));

  initials(name: string): string {
    return name?.slice(0, 2).toUpperCase() ?? '??';
  }
}
