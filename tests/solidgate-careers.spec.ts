import { test } from '@playwright/test';
import axios from 'axios';

const SOLIDGATE_CAREERS_URL = 'https://solidgate.com/careers/';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Keywords to match in job titles (case-insensitive)
const TARGET_KEYWORDS = /automation|qa|test|sdet/i;

interface Job {
  title: string;
  department: string;
  location: string;
  url: string;
}

test('Check Solidgate careers and send Telegram notification for matching jobs', async ({ page }) => {
  await page.goto(SOLIDGATE_CAREERS_URL, { timeout: 60000 });

  // Wait for job listings to load (JavaScript-rendered page)
  await page.waitForSelector('a[class*="CareersJobs_card"]', { timeout: 30000 });

  // Extract all job postings
  const jobElements = await page.locator('a[class*="CareersJobs_card"]').all();

  const jobs: Job[] = [];

  for (const jobElement of jobElements) {
    const title = await jobElement.locator('h3').innerText();

    // Extract department and location from badge elements
    const badges = await jobElement.locator('div[class*="CareerBadge_root"]').all();
    const department = badges.length > 0 ? await badges[0].innerText() : 'N/A';
    const location = badges.length > 1 ? await badges[1].innerText() : 'N/A';

    const href = await jobElement.getAttribute('href');
    const url = href ? `https://solidgate.com${href}` : SOLIDGATE_CAREERS_URL;

    jobs.push({ title, department, location, url });
  }

  console.log(`Found ${jobs.length} total jobs at Solidgate`);

  // Filter jobs matching target keywords
  const matchingJobs = jobs.filter(job => TARGET_KEYWORDS.test(job.title));

  console.log(`Found ${matchingJobs.length} matching jobs`);

  // Send notification for each matching job
  if (matchingJobs.length > 0) {
    for (const job of matchingJobs) {
      const message = formatJobMessage(job);
      console.log(`Sending notification for: ${job.title}`);
      await sendTelegramMessage(message);
    }
  } else {
    console.log('No matching jobs found');
  }
});

function formatJobMessage(job: Job): string {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;

  return `Date: ${formattedDate}

Found matching job at Solidgate:
Title: ${job.title}
Department: ${job.department}
Location: ${job.location}
URL: ${job.url}`;
}

async function sendTelegramMessage(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.');
    console.log('Message that would have been sent:', message);
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });
    console.log('Telegram notification sent successfully');
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}
