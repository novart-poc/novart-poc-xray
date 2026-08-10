import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given(
  'I open the page {string}',
  async function (this: CustomWorld, url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
);

Then(
  'the text {string} should be visible on the page',
  async function (this: CustomWorld, text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible({
      timeout: 10000
    });
  }
);
