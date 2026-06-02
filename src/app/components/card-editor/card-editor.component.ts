import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card, ColumnId, COLUMNS, LABEL_COLORS } from '../../models/card.model';

export interface CardEditorResult {
  title: string;
  description: string;
  label: string;
  column: ColumnId;
}

@Component({
  selector: 'app-card-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditorComponent implements AfterViewInit {
  @Input() initial: Partial<Card> = {};
  @Input() mode: 'add' | 'edit' = 'add';

  @Output() save = new EventEmitter<CardEditorResult>();
  @Output() dismiss = new EventEmitter<void>();

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  readonly columns = COLUMNS;
  readonly labels = LABEL_COLORS;

  readonly title = signal('');
  readonly description = signal('');
  readonly label = signal(LABEL_COLORS[0].value);
  readonly column = signal<ColumnId>('todo');

  ngOnInit(): void {
    this.title.set(this.initial.title ?? '');
    this.description.set(this.initial.description ?? '');
    this.label.set(this.initial.label ?? LABEL_COLORS[0].value);
    this.column.set((this.initial.column as ColumnId) ?? 'todo');
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.titleInput?.nativeElement.focus());
  }

  submit(event: Event): void {
    event.preventDefault();
    const trimmed = this.title().trim();
    if (!trimmed) return;
    this.save.emit({
      title: trimmed,
      description: this.description().trim(),
      label: this.label(),
      column: this.column(),
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dismiss.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dismiss.emit();
  }
}
