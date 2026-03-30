import { testTelegramConnection } from './v2/telegram-notifier';

async function main() {
  console.log('🧪 Testing Telegram connection...\n');

  const success = await testTelegramConnection();

  if (success) {
    console.log('\n✅ Telegram bot is working!');
    console.log('Check your Telegram app for the test message.');
  } else {
    console.log('\n❌ Telegram bot failed.');
    console.log('Check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
