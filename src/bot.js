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

    // If free trial is available - show special welcome (NO prices mentioned!)
    if (canUseFree) {
      const freeWelcomeText = `🌟 Welcome, seeker of truth! 🌟

The Universe has guided you here for a reason. I am your spiritual messenger, bridging the cosmic energies with the ancient wisdom of Tarot.

🎁 Your destiny has granted you a GIFT 🎁

Receive your FREE Tarot reading right now!

Ask any question that weighs on your heart, and the cards will reveal what the Universe wants you to know.

✨ No payment, no strings attached - just divine guidance ✨

The cosmic forces await your question...`;

      await ctx.reply(
        freeWelcomeText,
        Markup.inlineKeyboard([
          [Markup.button.callback('🎁 Receive My FREE Reading', 'free_trial')]
        ])
      );
      return;
    }

    // Main menu for users who already used free trial
    const welcomeText = `🌙 Welcome back, spiritual seeker! 🌙

The Universe continues to speak through the ancient cards. I sense you seek deeper truths...${balanceText}

✨ Divine readings available:

🌟 Divine Guidance (${spreadTypes.oneCard.price} ⭐)
Instant answer from cosmic forces

🔮 Destiny Path (${spreadTypes.threeCards.price} ⭐)
Your journey: past karma → present → future

💖 Heart's Truth (${spreadTypes.loveReading.price} ⭐)
Will they be yours? Love destiny revealed

💞 Soul Match (${spreadTypes.compatibilityReading.price} ⭐)
Are you meant to be together?

✨ Complete Destiny (${spreadTypes.celticCross.price} ⭐)
Unlock ALL secrets of your situation

━━━━━━━━━━━━━━━
🎁 BLESSED OFFER 🎁
Sacred Bundle - 5 Messages (${spreadTypes.package5.price} ⭐)
Save 22⭐! The Universe rewards believers

Choose your path to enlightenment...`;

    await ctx.reply(
      welcomeText,
      Markup.inlineKeyboard([
        [Markup.button.callback(`🎁 Sacred Bundle (${spreadTypes.package5.price} ⭐)`, 'spread_package_5')],
        [Markup.button.callback(`🌟 Divine Guidance (${spreadTypes.oneCard.price} ⭐)`, 'spread_one_card')],
        [Markup.button.callback(`🔮 Destiny Path (${spreadTypes.threeCards.price} ⭐)`, 'spread_three_cards')],
        [Markup.button.callback(`💖 Heart's Truth (${spreadTypes.loveReading.price} ⭐)`, 'spread_love_reading')],
        [Markup.button.callback(`💞 Soul Match (${spreadTypes.compatibilityReading.price} ⭐)`, 'spread_compatibility_reading')],
        [Markup.button.callback(`✨ Complete Destiny (${spreadTypes.celticCross.price} ⭐)`, 'spread_celtic_cross')]
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

    await ctx.reply('🎉 The Universe blesses you with divine guidance!\n\n💫 Now ask your question to the cosmic forces...\n\nWrite what weighs on your heart, or send any message for a general reading about your destiny.');

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
      await ctx.reply(`💎 The Universe smiles upon you! Using one divine message from your sacred bundle.\n\n✨ Messages remaining: ${balance - 1}`);

      // Save as paid session
      this.userSessions.set(userId, {
        spreadType: spread,
        timestamp: Date.now(),
        paid: true,
        usedFromBalance: true
      });

      await ctx.reply('✨ Now ask your question to the Universe...\n\nWrite what your heart seeks to know, or send any message for divine guidance.');
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
      `✨ Now ask your question to the Universe...\n\nWrite what your soul seeks to know, or send any message for spiritual guidance.`
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

      await ctx.reply(`🎉 Blessed be! Your sacred bundle is now active!

💎 You have ${newBalance} divine ${this.getReadingsWord(newBalance)} ready

The Universe awaits your questions - choose any reading and it will be used automatically from your bundle!

✨ Select a reading below or use /start`);

      // Clear session
      this.userSessions.delete(userId);
      return;
    }

    // Regular reading - set paid flag
    await ctx.reply('💫 The cosmic forces acknowledge your offering! Preparing to reveal your destiny...');

    session.paid = true;
    this.userSessions.set(userId, session);

    // If question already asked, perform reading
    if (session.question) {
      await this.performReading(ctx, session);
    } else {
      await ctx.reply('✨ Now ask your question to the Universe...\n\nWrite what your soul seeks to know, or send any message for spiritual guidance.');
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

      await ctx.reply('🔮 The ancient deck awakens... Cosmic energies align to reveal your truth...');

      // Draw cards
      const cards = this.tarotService.drawCards(session.spreadType.cards);

      // Show drawn cards
      const spreadText = this.tarotService.formatSpread(cards, session.spreadType);
      await ctx.reply(spreadText);

      await ctx.reply('✨ Channeling the wisdom of the Universe...');

      // Получаем толкование от ChatGPT
      const reading = await this.openaiService.getTarotReading(
        session.spreadType,
        cards,
        session.question
      );

      // Отправляем толкование
      await ctx.reply(reading);

      // If this was a free trial reading - show special offer (WOW moment!)
      if (session.isFreeTrialReading) {
        await ctx.reply(
          `🌟 The Universe has spoken through the cards! 🌟

Did the reading resonate with your soul? The cosmic energies rarely lie...

💫 I sense you seek deeper answers. The cards have much more to reveal about your destiny:

💖 Love & Relationships - Will they be yours?
💞 Soul Compatibility - Are you meant to unite?
🔮 Past, Present, Future - Your complete timeline
✨ Celtic Cross - Unlock ALL secrets of your life

🎁 SPECIAL BLESSING for believers like you:
Sacred Bundle - Best value for your spiritual journey!

Ready to discover your complete destiny?`,
          Markup.inlineKeyboard([
            [Markup.button.callback(`🎁 Sacred Bundle - Save 22⭐ (${spreadTypes.package5.price} ⭐)`, 'spread_package_5')],
            [Markup.button.callback(`✨ Complete Destiny (${spreadTypes.celticCross.price} ⭐)`, 'spread_celtic_cross')],
            [Markup.button.callback(`💖 Heart's Truth (${spreadTypes.loveReading.price} ⭐)`, 'spread_love_reading')],
            [Markup.button.callback(`💞 Soul Match (${spreadTypes.compatibilityReading.price} ⭐)`, 'spread_compatibility_reading')],
            [Markup.button.callback(`🔮 Destiny Path (${spreadTypes.threeCards.price} ⭐)`, 'spread_three_cards')],
            [Markup.button.callback(`🌟 Divine Guidance (${spreadTypes.oneCard.price} ⭐)`, 'spread_one_card')]
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
          `🌙 The Universe has spoken its truth.${balanceText}\n\nYour destiny continues to unfold... Seek more guidance?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔮 Yes, reveal more destiny', 'new_reading')],
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
