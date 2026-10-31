import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Layout } from './layout';

@Component({ template: '' })
class Stub {}

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;
  let el: HTMLElement;

  const toggle = () => el.querySelector<HTMLButtonElement>('.menu-toggle')!;
  const menu = () => el.querySelector<HTMLElement>('#site-menu')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([{ path: '**', component: Stub }]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with the phone menu closed', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().getAttribute('aria-label')).toBe('Open menu');
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('opens and closes with the hamburger button', () => {
    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Close menu');
    expect(menu().classList.contains('open')).toBe(true);

    toggle().click();
    fixture.detectChanges();
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('lists every page in the menu', () => {
    const labels = Array.from(menu().querySelectorAll('.nav-item')).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Dashboard', 'Compare loans', 'Compare Accounts', 'Credit score', 'Compare insurance']);
  });

  it('closes after choosing a page', () => {
    toggle().click();
    fixture.detectChanges();
    menu().querySelector<HTMLAnchorElement>('.nav-item')!.click();
    fixture.detectChanges();
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('closes on Escape', () => {
    toggle().click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('closes when tapping outside the header, but not inside it', () => {
    toggle().click();
    fixture.detectChanges();

    el.querySelector<HTMLElement>('.topbar')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    el.querySelector<HTMLElement>('main')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(false);
  });
});
