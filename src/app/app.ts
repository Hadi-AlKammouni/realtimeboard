import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BoardComponent } from './components/board/board.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BoardComponent, TopBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = signal<'dark' | 'light'>(this.readTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  protected onToggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
    try {
      localStorage.setItem('rt-theme', next);
    } catch {
      /* SSR / disabled storage */
    }
  }

  private readTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem('rt-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* no-op */
    }
    return 'dark';
  }

  private applyTheme(t: 'dark' | 'light'): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
    }
  }
}
