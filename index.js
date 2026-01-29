require('dotenv').config();
const TarotBot = require('./src/bot');
const http = require('http');

// Проверка наличия необходимых переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required!');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required!');
  process.exit(1);
}

// Создание и запуск бота
async function startBot() {
  const bot = new TarotBot(process.env.BOT_TOKEN, process.env.OPENAI_API_KEY);
  await bot.launch();
  console.log('✨ Tarot Telegram Bot started successfully!');
}

// HTTP сервер для Render (чтобы сервис не засыпал)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Tarot Bot is running! 🔮');
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

startBot().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
