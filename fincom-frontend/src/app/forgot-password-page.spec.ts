import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from './auth';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  async function setup(impl: () => Promise<string> = async () => 'ok') {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const request = vi.spyOn(TestBed.inject(Auth), 'requestPasswordReset').mockImplementation(impl);
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, request };
  }

  it('needs an email first', async () => {
    const { page, request } = await setup();
    await page.submit();
    expect(request).not.toHaveBeenCalled();
    expect(page.error()).toContain('enter your email');
  });

  it('shows "Check your email" after the link is requested', async () => {
    const { fixture, page, el, request } = await setup();
    page.email = ' Amina@Example.com ';
    await page.submit();
    fixture.detectChanges();
    expect(request).toHaveBeenCalledWith('Amina@Example.com');
    expect(el.querySelector('h1')!.textContent).toContain('Check your email');
    expect(el.textContent).toContain('Amina@Example.com');
    expect(el.querySelector('form')).toBeNull();
  });

  it('"Try again" brings the form back', async () => {
    const { fixture, page, el } = await setup();
    page.email = 'a@b.co';
    await page.submit();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('button.auth-link')!.click();
    fixture.detectChanges();
    expect(el.querySelector('form')).toBeTruthy();
  });

  it('shows a network error', async () => {
    const { fixture, page, el } = await setup(async () => {
      throw new Error('Cannot reach the server. Please try again later.');
    });
    page.email = 'a@b.co';
    await page.submit();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Cannot reach the server');
  });
});
