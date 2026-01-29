# ✅ Чеклист для быстрого деплоя

## Подготовка (5 минут)

- [ ] Есть токен от @BotFather
- [ ] Есть OpenAI API ключ с балансом
- [ ] Telegram Stars активированы в боте

---

## 1. Supabase (3 минуты)

1. [ ] Зарегистрироваться на [supabase.com](https://supabase.com)
2. [ ] Создать проект (New Project → Free plan)
3. [ ] SQL Editor → выполнить `supabase-schema.sql`
4. [ ] Settings → API → скопировать:
   - [ ] Project URL
   - [ ] anon public key

---

## 2. GitHub (2 минуты)

1. [ ] Создать репозиторий на [github.com](https://github.com)
   - Name: `tarot-telegram-bot`
   - Public/Private
2. [ ] Загрузить код:
```bash
cd ~/Desktop/tarot-telegram-bot
git remote add origin https://github.com/YOUR_USERNAME/tarot-telegram-bot.git
git push -u origin main
```

---

## 3. Render (5 минут)

1. [ ] Зарегистрироваться на [render.com](https://render.com)
2. [ ] New + → Web Service
3. [ ] Connect GitHub → выбрать репозиторий
4. [ ] Настройки:
   - [ ] Runtime: **Node**
   - [ ] Build Command: `npm install`
   - [ ] Start Command: `npm start`
   - [ ] Instance Type: **Free**

5. [ ] Добавить переменные (Advanced):
   - [ ] `BOT_TOKEN` = ваш_токен
   - [ ] `OPENAI_API_KEY` = ваш_ключ
   - [ ] `SUPABASE_URL` = https://...
   - [ ] `SUPABASE_KEY` = ваш_anon_key

6. [ ] Create Web Service
7. [ ] Дождаться статуса "Live" (3-5 минут)

---

## 4. Проверка (1 минута)

- [ ] Render → Logs → видно "Bot is running"
- [ ] Telegram → бот отвечает на /start
- [ ] Бесплатный расклад работает
- [ ] Платежи работают

---

## ✅ ГОТОВО!

Бот работает 24/7!

### Полезные ссылки:
- Render Dashboard: https://dashboard.render.com
- Supabase Dashboard: https://app.supabase.com
- Логи бота: Render → ваш сервис → Logs
- База данных: Supabase → Table Editor → users

### Обновление кода:
```bash
git add .
git commit -m "Описание изменений"
git push
```
Render автоматически задеплоит!

---

💡 **Совет:** Сохраните все URL и ключи в безопасном месте!
