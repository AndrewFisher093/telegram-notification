import { test } from '@playwright/test';
import axios from 'axios';

const JYSK_URL = 'https://jysk.pl/biuro/krzesla-biurowe/krzeslo-biurowe-varpelev-czarny-siatka/czarny';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

test('Check chair price and send Telegram notification', async ({ page }) => {
  await page.goto(JYSK_URL, { timeout: 60000 });

  const priceElement = await page.locator('span.ssr-product-price__value');
  const price = await priceElement.innerText();

  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;

  console.log(`Date: ${formattedDate}. Actual price of the chair now is: ${price}`);

  await sendTelegramMessage(`Date: ${formattedDate}. Actual price of the chair now is: ${price}`);
});

async function sendTelegramMessage(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}