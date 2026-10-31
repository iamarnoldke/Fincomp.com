import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from './auth';
import { SignupPage } from './signup-page';

describe('SignupPage', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [SignupPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const register = vi.spyOn(TestBed.inject(Auth), 'registerAccount').mockResolvedValue({} as never);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SignupPage);
    fixture.detectChanges();
    return { page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, register, navigate };
  }

  it('shows the 8 character hint', async () => {
    const { el } = await setup();
    expect(el.querySelector('.auth-hint')!.textContent).toContain('At least 8 characters');
  });

  it('rejects a short password without calling the server', async () => {
    const { page, register } = await setup();
    page.name = 'Amina';
    page.email = 'a@b.co';
    page.password = 'short';
    await page.submit();
    expect(register).not.toHaveBeenCalled();
    expect(page.error()).toContain('at least 8 characters');
  });

  it('creates the account and goes to the dashboard', async () => {
    const { page, register, navigate } = await setup();
    page.name = ' Amina Kato ';
    page.email = ' a@b.co ';
    page.password = 'longenough1';
    await page.submit();
    expect(register).toHaveBeenCalledWith('Amina Kato', 'a@b.co', 'longenough1');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
