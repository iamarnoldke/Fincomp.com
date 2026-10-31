import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PasswordField } from './password-field';

@Component({
  imports: [PasswordField],
  template: `<app-password-field label="Password" name="pw" hint="At least 8 characters." [(value)]="pw" />`,
})
class Host {
  pw = '';
}

describe('PasswordField', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, input: () => el.querySelector('input')!, eye: () => el.querySelector('.auth-eye') as HTMLButtonElement };
  }

  it('hides the password and links the label to the input', async () => {
    const { el, input } = await setup();
    expect(input().type).toBe('password');
    expect(input().id).toBe('pw');
    expect(el.querySelector('label')!.getAttribute('for')).toBe('pw');
    expect(el.querySelector('.auth-hint')!.textContent).toContain('At least 8 characters.');
  });

  it('writes what the user types back to the parent', async () => {
    const { fixture, input } = await setup();
    input().value = 'secret123';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.pw).toBe('secret123');
  });

  it('the eye button shows and hides the password', async () => {
    const { fixture, input, eye } = await setup();
    expect(eye().getAttribute('aria-label')).toBe('Show password');
    eye().click();
    fixture.detectChanges();
    expect(input().type).toBe('text');
    expect(eye().getAttribute('aria-label')).toBe('Hide password');
    expect(eye().getAttribute('aria-pressed')).toBe('true');
    eye().click();
    fixture.detectChanges();
    expect(input().type).toBe('password');
  });
});
