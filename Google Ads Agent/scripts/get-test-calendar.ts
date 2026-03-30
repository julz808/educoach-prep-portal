import { db } from '../shared/database';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const testCalendar = await db.getTestCalendar();

  console.log('\n📅 TEST CALENDAR\n');
  console.log('─'.repeat(140));
  console.log(
    'Product'.padEnd(25) +
    'Test Date'.padEnd(15) +
    'Reg Deadline'.padEnd(15) +
    'Max Budget'.padEnd(12) +
    'Target CAC'.padEnd(12) +
    'Pause CAC'.padEnd(12) +
    'Weeks Until Test'.padEnd(18)
  );
  console.log('─'.repeat(140));

  const today = new Date();

  testCalendar.forEach(t => {
    let weeksUntil = 'N/A';
    if (t.test_date_primary) {
      const testDate = new Date(t.test_date_primary);
      const diffTime = testDate.getTime() - today.getTime();
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      weeksUntil = diffWeeks.toString();
    }

    console.log(
      (t.product_slug || 'N/A').padEnd(25) +
      (t.test_date_primary || 'N/A').padEnd(15) +
      (t.registration_deadline || 'N/A').padEnd(15) +
      ('$' + (t.max_daily_budget_aud || 0)).padEnd(12) +
      ('$' + (t.target_cpa_aud || 0)).padEnd(12) +
      ('$' + (t.pause_cpa_aud || 0)).padEnd(12) +
      weeksUntil.padEnd(18)
    );
  });

  console.log('─'.repeat(140));
  console.log();

  process.exit(0);
}

main();
