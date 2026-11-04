import { Component, computed, input } from '@angular/core';

export interface Slice {
  label: string;
  value: number;
  display: string;
  color: string;
}

@Component({
  selector: 'app-pie-chart',
  template: `
    <div class="wrap">
      <svg viewBox="-1 -1 2 2" width="140" height="140" role="img" [attr.aria-label]="title()">
        @if (total() === 0) {
          <circle r="1" cx="0" cy="0" fill="#e4e7ec" />
        } @else if (visible().length === 1) {
          <circle r="1" cx="0" cy="0" [attr.fill]="visible()[0].color" />
        } @else {
          @for (p of paths(); track p.label) {
            <path [attr.d]="p.d" [attr.fill]="p.color" />
          }
        }
      </svg>

      <div>
        <ul class="legend">
          @for (s of slices(); track s.label) {
            <li>
              <span class="dot" [style.background]="s.color"></span>
              {{ s.label }}: <strong>{{ s.display }}</strong> ({{ percent(s.value) }}%)
            </li>
          }
        </ul>
        @if (total() === 0) {
          <p class="empty">No data yet</p>
        }
      </div>
    </div>
  `,
  styles: `
    .wrap { display: flex; align-items: center; gap: 16px; }
    .legend { list-style: none; margin: 0; padding: 0; font-size: 13px; color: #444444; }
    .legend li { margin: 6px 0; }
    .dot { display: inline-block; width: 10px; height: 10px; margin-right: 6px; border-radius: 50%; }
    .empty { margin: 8px 0 0; font-size: 13px; color: #777777; }
  `
})
export class PieChart {
  title = input<string>('Chart');
  slices = input<Slice[]>([]);

  total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));
  visible = computed(() => this.slices().filter((s) => s.value > 0));

  paths = computed(() => {
    const total = this.total();
    let start = -Math.PI / 2;
    return this.visible().map((s) => {
      const angle = (s.value / total) * 2 * Math.PI;
      const end = start + angle;
      const large = angle > Math.PI ? 1 : 0;
      const d = `M 0 0 L ${Math.cos(start)} ${Math.sin(start)} A 1 1 0 ${large} 1 ${Math.cos(end)} ${Math.sin(end)} Z`;
      start = end;
      return { label: s.label, color: s.color, d };
    });
  });

  percent(value: number): number {
    const total = this.total();
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }
}