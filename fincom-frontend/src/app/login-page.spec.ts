import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from './auth';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  async function setup(login: () => Promise<unknown> = async () => ({})) {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const auth = TestBed.inject(Auth);
    const loginSpy = vi.spyOn(auth, 'login').mockImplementation(login as never);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, loginSpy, navigate };
  }

  it('shows the form with a forgot password link', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')!.textContent).toContain('Welcome back');
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
    expect(el.querySelector('a[href="/signup"]')).toBeTruthy();
  });

  it('asks for both fields before calling the server', async () => {
    const { page, loginSpy } = await setup();
    page.email = 'a@b.co';
    await page.submit();
    expect(loginSpy).not.toHaveBeenCalled();
    expect(page.error()).toContain('both your email and password');
  });

  it('logs in and goes to the dashboard', async () => {
    const { page, loginSpy, navigate } = await setup();
    page.email = ' a@b.co ';
    page.password = 'pw123456';
    await page.submit();
    expect(loginSpy).toHaveBeenCalledWith('a@b.co', 'pw123456');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(page.loading()).toBe(false);
  });

  it('shows the server error and stays put', async () => {
    const { page, fixture, el, navigate } = await setup(async () => {
      throw new Error('Invalid email or password');
    });
    page.email = 'a@b.co';
    page.password = 'wrongpass';
    await page.submit();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Invalid email or password');
    expect(navigate).not.toHaveBeenCalled();
  });
});
