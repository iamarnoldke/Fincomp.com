import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from './auth';
import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  async function setup(query: Record<string, string>, impl: () => Promise<string> = async () => 'ok') {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    const reset = vi.spyOn(TestBed.inject(Auth), 'resetPassword').mockImplementation(impl);
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, reset };
  }

  it('reads the token from the link and shows the form', async () => {
    const { page, el } = await setup({ token: 'abc123' });
    expect(page.token()).toBe('abc123');
    expect(el.querySelector('form')).toBeTruthy();
  });

  it('explains a link with no token and offers a new one', async () => {
    const { el } = await setup({});
    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).toContain('This link is incomplete');
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
  });

  it('rejects a short password without calling the server', async () => {
    const { page, reset } = await setup({ token: 't' });
    page.password = 'short';
    await page.submit();
    expect(reset).not.toHaveBeenCalled();
    expect(page.error()).toContain('at least 8 characters');
  });

  it('changes the password and offers to log in', async () => {
    const { fixture, page, el, reset } = await setup({ token: 'tok-1' });
    page.password = 'brandnew123';
    await page.submit();
    fixture.detectChanges();
    expect(reset).toHaveBeenCalledWith('tok-1', 'brandnew123');
    expect(el.querySelector('h1')!.textContent).toContain('Password changed');
    expect(el.querySelector('a[href="/login"]')).toBeTruthy();
  });

  it('shows an expired-link error with a way to get a new one', async () => {
    const { fixture, page, el } = await setup({ token: 'old' }, async () => {
      throw new Error('This reset link is invalid or has expired. Please request a new one.');
    });
    page.password = 'brandnew123';
    await page.submit();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('invalid or has expired');
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
  });
});
