import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given(
  'ich oeffne die Seite {string}',
  async function (this: CustomWorld, url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
);

Then(
  'sollte der Text {string} auf der Seite sichtbar sein',
  async function (this: CustomWorld, text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible({
      timeout: 10000
    });
  }
);
