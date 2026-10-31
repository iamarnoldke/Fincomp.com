import { Component, ViewEncapsulation, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-password-field',
  templateUrl: './password-field.html',
  encapsulation: ViewEncapsulation.None,
})
export class PasswordField {
  readonly label = input.required<string>();
  readonly name = input('password');
  readonly placeholder = input('');
  readonly autocomplete = input('current-password');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly value = model('');

  readonly visible = signal(false);

  toggle(): void {
    this.visible.update((v) => !v);
  }

  onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
