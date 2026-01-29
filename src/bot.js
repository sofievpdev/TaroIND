const { Telegraf, Markup } = require('telegraf');
const OpenAIService = require('./services/openaiService');
const TarotService = require('./services/tarotService');
const SupabaseStorage = require('./services/supabaseStorage');
const { spreadTypes } = require('./data/spreadConfig');

class TarotBot {
  constructor(botToken, openaiApiKey) {
    this.bot = new Telegraf(botToken);
    this.openaiService = new OpenAIService(openaiApiKey);
    this.tarotService = new TarotService();
    this.userStorage = new SupabaseStorage();

    // Хранилище данных пользователей (в продакшене использовать БД)
    this.userSessions = new Map();

    this.setupHandlers();
  }

  // Инициализация хранилища
  async initialize() {
    await this.userStorage.init();
    console.log('✅ User storage initialized');
  }

  setupHandlers() {
    // Команда /start
    this.bot.start((ctx) => this.handleStart(ctx));

    // Команда /stats - статистика (только для админа)
    this.bot.command('stats', (ctx) => this.handleStats(ctx));

    // Обработка выбора расклада
    this.bot.action(/spread_(.+)/, (ctx) => this.handleSpreadSelection(ctx));

    // Обработка кнопки "новый расклад"
    this.bot.action('new_reading', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (error) {
        // Игнорируем ошибки старых callback кнопок
      }
      this.handleStart(ctx);
    });

    // Обработка бесплатного расклада
    this.bot.action('free_trial', (ctx) => this.handleFreeTrial(ctx));

    // Обработка pre_checkout запроса
    this.bot.on('pre_checkout_query', (ctx) => this.handlePreCheckout(ctx));

    // Обработка успешной оплаты
    this.bot.on('successful_payment', (ctx) => this.handleSuccessfulPayment(ctx));

    // Обработка текстовых сообщений (вопрос пользователя)
    this.bot.on('text', (ctx) => this.handleUserQuestion(ctx));

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('An error occurred. Please try again.');
    });
  }

  // Приветствие и главное меню
  async handleStart(ctx) {
    const userId = ctx.from.id;
    const balance = this.userStorage.getBalance(userId);
    const canUseFree = this.userStorage.canUseFreeTrial(userId);

    let balanceText = '';
    if (balance > 0) {
      balanceText = `\n💎 You have ${balance} ${this.getReadingsWord(balance)} in your balance!\n`;
    }

    // If free trial is available - show special welcome
    if (canUseFree) {
      const freeWelcomeText = `🌙 Welcome to the World of Tarot 🌙

The Universe speaks to you through signs and symbols. I am your guide to reveal what the cards have to say.

🎁 SPECIAL GIFT FOR YOU 🎁
Get a FREE "One Card" reading!
Ask any question and receive an answer from the Universe.

After your free reading, discover more wisdom:
🌟 One Card - ${spreadTypes.oneCard.price} ⭐
🔮 Three Cards - ${spreadTypes.threeCards.price} ⭐
💖 Love Reading - ${spreadTypes.loveReading.price} ⭐
💞 Compatibility Reading - ${spreadTypes.compatibilityReading.price} ⭐
✨ Celtic Cross - ${spreadTypes.celticCross.price} ⭐
🎁 Package of 5 Readings - ${spreadTypes.package5.price} ⭐ (best value!)

Begin your journey with a free reading now! ✨`;

      await ctx.reply(
        freeWelcomeText,
        Markup.inlineKeyboard([
          [Markup.button.callback('🎁 Get FREE Reading', 'free_trial')]
        ])
      );
      return;
    }

    // Main menu for users who already used free trial
    const welcomeText = `🌙 Welcome to the World of Tarot 🌙

The Universe speaks to you through signs. I am your guide to reveal divine wisdom from the cards.${balanceText}
✨ What I can do for you:

🌟 One Card - ${spreadTypes.oneCard.price} ⭐
Quick answer to your question

🔮 Three Cards - ${spreadTypes.threeCards.price} ⭐
Past, present, and future

💖 Love Reading - ${spreadTypes.loveReading.price} ⭐
Secrets of your relationship

💞 Compatibility Reading - ${spreadTypes.compatibilityReading.price} ⭐
Your connection with another

✨ Celtic Cross - ${spreadTypes.celticCross.price} ⭐
Deep analysis of your situation

━━━━━━━━━━━━━━━
🎁 SPECIAL OFFER 🎁
Package of 5 Readings - ${spreadTypes.package5.price} ⭐
Save 22+ stars! Use for any readings

Choose a spread to begin your journey...`;

    await ctx.reply(
      welcomeText,
      Markup.inlineKeyboard([
        [Markup.button.callback(`🎁 Package 5 Readings (${spreadTypes.package5.price} ⭐)`, 'spread_package_5')],
        [Markup.button.callback(`🌟 One Card (${spreadTypes.oneCard.price} ⭐)`, 'spread_one_card')],
        [Markup.button.callback(`🔮 Three Cards (${spreadTypes.threeCards.price} ⭐)`, 'spread_three_cards')],
        [Markup.button.callback(`💖 Love Reading (${spreadTypes.loveReading.price} ⭐)`, 'spread_love_reading')],
        [Markup.button.callback(`💞 Compatibility (${spreadTypes.compatibilityReading.price} ⭐)`, 'spread_compatibility_reading')],
        [Markup.button.callback(`✨ Celtic Cross (${spreadTypes.celticCross.price} ⭐)`, 'spread_celtic_cross')]
      ])
    );
  }

  // Get correct plural form for "reading(s)"
  getReadingsWord(count) {
    return count === 1 ? 'reading' : 'readings';
  }

  // Обработка бесплатного расклада
  async handleFreeTrial(ctx) {
    try {
      await ctx.answerCbQuery();
    } catch (error) {
      // Игнорируем ошибки старых callback кнопок
    }

    const userId = ctx.from.id;

    // Check if free trial is available
    if (!this.userStorage.canUseFreeTrial(userId)) {
      await ctx.reply('You have already used your free reading! 😊\n\nChoose one of the paid readings:');
      return this.handleStart(ctx);
    }

    // Mark free trial as used
    await this.userStorage.useFreeTrial(userId);

    await ctx.reply('🎉 Wonderful! You get a FREE "One Card" reading!\n\nNow ask your question to the Universe...\n\nWrite what\'s on your mind, or simply send any message for a general reading.');

    // Сохраняем сессию как бесплатный расклад
    this.userSessions.set(userId, {
      spreadType: spreadTypes.oneCard,
      timestamp: Date.now(),
      paid: true,
      isFreeTrialReading: true
    });
  }

  // Обработка выбора расклада
  async handleSpreadSelection(ctx) {
    try {
      await ctx.answerCbQuery();
    } catch (error) {
      // Игнорируем ошибки старых callback кнопок
    }

    const spreadId = ctx.match[1];
    const spread = Object.values(spreadTypes).find(s => s.id === spreadId);

    if (!spread) {
      return ctx.reply('Reading not found');
    }

    const userId = ctx.from.id;

    // If it's a package - send invoice
    if (spread.isPackage) {
      this.userSessions.set(userId, {
        spreadType: spread,
        timestamp: Date.now()
      });
      return await this.sendInvoice(ctx, spread);
    }

    // For regular reading - check balance
    const balance = this.userStorage.getBalance(userId);

    if (balance > 0) {
      // Has balance - use from package
      await ctx.reply(`💎 Excellent choice! Using a reading from your package.\n\nReadings remaining: ${balance - 1}`);

      // Save as paid session
      this.userSessions.set(userId, {
        spreadType: spread,
        timestamp: Date.now(),
        paid: true,
        usedFromBalance: true
      });

      await ctx.reply('Now ask your question to the cards...\n\nWrite what\'s on your mind, or simply send any message for a general reading.');
    } else {
      // Нет баланса - нужна оплата
      this.userSessions.set(userId, {
        spreadType: spread,
        timestamp: Date.now()
      });

      await this.sendInvoice(ctx, spread);
    }
  }

  // Отправка инвойса для оплаты
  async sendInvoice(ctx, spread) {
    const invoice = {
      title: spread.name,
      description: spread.description,
      payload: JSON.stringify({
        spreadId: spread.id,
        userId: ctx.from.id
      }),
      currency: 'XTR', // Telegram Stars
      prices: [{ label: spread.name, amount: spread.price }]
    };

    await ctx.replyWithInvoice(invoice);

    await ctx.reply(
      `Now ask your question to the cards...\n\nWrite what's on your mind, or simply send any message for a general reading.`
    );
  }

  // Handle pre_checkout
  async handlePreCheckout(ctx) {
    await ctx.answerPreCheckoutQuery(true);
  }

  // Handle successful payment
  async handleSuccessfulPayment(ctx) {
    const userId = ctx.from.id;
    const session = this.userSessions.get(userId);

    if (!session) {
      return ctx.reply('Error: session not found. Please start again with /start');
    }

    // If bought a package - add readings to balance
    if (session.spreadType.isPackage) {
      await this.userStorage.addReadings(userId, session.spreadType.readingsCount);
      const newBalance = this.userStorage.getBalance(userId);

      await ctx.reply(`🎉 Congratulations! Package activated!

💎 You now have ${newBalance} ${this.getReadingsWord(newBalance)} in your balance

Use them for any readings - just choose a reading from the menu, and it will be deducted automatically!

Choose a reading from the menu below or send /start`);

      // Clear session
      this.userSessions.delete(userId);
      return;
    }

    // Regular reading - set paid flag
    await ctx.reply('💫 Payment received! The Universe hears your question...');

    session.paid = true;
    this.userSessions.set(userId, session);

    // If question already asked, perform reading
    if (session.question) {
      await this.performReading(ctx, session);
    } else {
      await ctx.reply('Now ask your question to the cards...\n\nWrite what\'s on your mind, or simply send any message for a general reading.');
    }
  }

  // Handle user question
  async handleUserQuestion(ctx) {
    const session = this.userSessions.get(ctx.from.id);

    if (!session) {
      return ctx.reply('First choose a reading using /start');
    }

    // Save question
    session.question = ctx.message.text;
    this.userSessions.set(ctx.from.id, session);

    // If payment completed, perform reading
    if (session.paid) {
      await this.performReading(ctx, session);
    } else {
      await ctx.reply('💫 Question received. Awaiting payment completion...');
    }
  }

  // Statistics (admin only)
  async handleStats(ctx) {
    const userId = ctx.from.id;
    const adminId = process.env.ADMIN_USER_ID || '178223077'; // Your Telegram ID

    // Check if admin
    if (adminId && userId.toString() !== adminId) {
      return; // Ignore command for non-admins
    }

    try {
      await ctx.reply('📊 Collecting statistics...');

      // Get all data from Supabase
      const { data: users, error } = await this.userStorage.supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const totalUsers = users.length;
      const usedFreeTrial = users.filter(u => u.has_used_free_trial).length;
      const usersWithBalance = users.filter(u => u.readings_balance > 0).length;
      const totalPurchases = users.reduce((sum, u) => sum + u.total_purchases, 0);
      const totalBalance = users.reduce((sum, u) => sum + u.readings_balance, 0);

      // Conversion: how many who used free trial then purchased
      const conversions = users.filter(u => u.has_used_free_trial && u.total_purchases > 0).length;
      const conversionRate = usedFreeTrial > 0 ? ((conversions / usedFreeTrial) * 100).toFixed(1) : 0;

      const statsText = `📊 BOT STATISTICS

👥 Total users: ${totalUsers}
🎁 Used free trial: ${usedFreeTrial}
💰 Total purchases: ${totalPurchases}
💎 Users with balance: ${usersWithBalance}
📦 Readings in balances: ${totalBalance}

💵 Conversion:
   ${conversions} out of ${usedFreeTrial} purchased after free trial (${conversionRate}%)

📈 Recent registrations:`;

      await ctx.reply(statsText);

      // Last 10 users
      const recent = users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      let recentText = '📋 Last 10 users:\n\n';
      recent.forEach((u, i) => {
        const date = new Date(u.created_at).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        recentText += `${i + 1}. User ${u.user_id}\n`;
        recentText += `   📅 ${date}\n`;
        recentText += `   💎 Balance: ${u.readings_balance}, Purchases: ${u.total_purchases}\n\n`;
      });

      await ctx.reply(recentText);

    } catch (error) {
      console.error('Stats error:', error);
      await ctx.reply('Error retrieving statistics');
    }
  }

  // Выполнение расклада
  async performReading(ctx, session) {
    const userId = ctx.from.id;

    try {
      // Если расклад использован из баланса - списываем
      if (session.usedFromBalance) {
        await this.userStorage.useReading(userId);
      }

      await ctx.reply('🔮 Shuffling the deck... The cards reveal their secrets...');

      // Draw cards
      const cards = this.tarotService.drawCards(session.spreadType.cards);

      // Show drawn cards
      const spreadText = this.tarotService.formatSpread(cards, session.spreadType);
      await ctx.reply(spreadText);

      await ctx.reply('✨ Meditating on the cards...');

      // Получаем толкование от ChatGPT
      const reading = await this.openaiService.getTarotReading(
        session.spreadType,
        cards,
        session.question
      );

      // Отправляем толкование
      await ctx.reply(reading);

      // If this was a free trial reading - show special offer
      if (session.isFreeTrialReading) {
        await ctx.reply(
          `🌙 Thank you for trusting the cards!\n\n✨ Did you like it? Want to discover more?\n\nI can reveal even deeper wisdom:`,
          Markup.inlineKeyboard([
            [Markup.button.callback(`🎁 Package 5 Readings (${spreadTypes.package5.price} ⭐)`, 'spread_package_5')],
            [Markup.button.callback(`🌟 One Card (${spreadTypes.oneCard.price} ⭐)`, 'spread_one_card')],
            [Markup.button.callback(`🔮 Three Cards (${spreadTypes.threeCards.price} ⭐)`, 'spread_three_cards')],
            [Markup.button.callback(`💖 Love Reading (${spreadTypes.loveReading.price} ⭐)`, 'spread_love_reading')],
            [Markup.button.callback(`💞 Compatibility (${spreadTypes.compatibilityReading.price} ⭐)`, 'spread_compatibility_reading')],
            [Markup.button.callback(`✨ Celtic Cross (${spreadTypes.celticCross.price} ⭐)`, 'spread_celtic_cross')]
          ])
        );
      } else {
        // Regular message for paid readings
        const balance = this.userStorage.getBalance(userId);
        let balanceText = '';
        if (balance > 0) {
          balanceText = `\n\n💎 You have ${balance} ${this.getReadingsWord(balance)} remaining`;
        }

        await ctx.reply(
          `🌙 Thank you for trusting the cards.${balanceText}\n\nWould you like another reading?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔮 Yes, new reading', 'new_reading')],
          ])
        );
      }

      // Clear session
      this.userSessions.delete(userId);

    } catch (error) {
      console.error('Reading error:', error);
      await ctx.reply('Sorry, an error occurred during the reading. Please try again later.');
      this.userSessions.delete(ctx.from.id);
    }
  }

  // Запуск бота
  async launch() {
    // Инициализируем хранилище
    await this.initialize();

    this.bot.launch();
    console.log('🔮 Tarot Bot is running...');

    // Graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

module.exports = TarotBot;
