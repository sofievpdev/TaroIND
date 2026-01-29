# 📤 Загрузка бота на GitHub

## Шаг 1: Установка Command Line Tools (если не завершена)

Если установка еще идет, дождитесь её завершения. Это может занять 5-10 минут.

Проверить установку можно командой:
```bash
git --version
```

## Шаг 2: Создание репозитория на GitHub

1. Откройте [github.com](https://github.com)
2. Нажмите кнопку **"New"** или **"+"** → **"New repository"**
3. Заполните данные:
   - **Repository name**: `tarot-telegram-bot`
   - **Description**: `Telegram bot for Tarot readings with ChatGPT and Telegram Stars`
   - **Public** или **Private** - на ваш выбор
   - ❌ **НЕ** ставьте галочки на "Add a README" или ".gitignore" (они уже есть)
4. Нажмите **"Create repository"**

## Шаг 3: Инициализация Git локально

Откройте терминал и выполните:

```bash
cd ~/Desktop/tarot-telegram-bot

# Инициализация репозитория
git init

# Добавление всех файлов
git add .

# Создание первого коммита
git commit -m "Initial commit: Tarot Telegram Bot with ChatGPT integration

- 4 types of Tarot spreads (1, 3, 5, 10 cards)
- OpenAI ChatGPT integration for mystical readings
- Telegram Stars payment system
- 78 Tarot cards database
- Mystical style responses"
```

## Шаг 4: Подключение к GitHub

Замените `YOUR_USERNAME` на ваше имя пользователя GitHub:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tarot-telegram-bot.git
git push -u origin main
```

Если попросит авторизацию:
- Username: ваш логин GitHub
- Password: используйте **Personal Access Token** (не пароль!)

### Как создать Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите срок действия и отметьте **repo**
4. Сгенерируйте и скопируйте токен
5. Используйте его вместо пароля

## Шаг 5: Проверка

Откройте ваш репозиторий на GitHub:
```
https://github.com/YOUR_USERNAME/tarot-telegram-bot
```

Вы должны увидеть все файлы проекта!

## 🔒 Важно!

Убедитесь, что файл `.env` **НЕ** загружен на GitHub!

Проверьте:
- Откройте репозиторий на GitHub
- `.env` файла не должно быть видно
- Должен быть только `.env.example`

Если `.env` попал в репозиторий:
```bash
git rm --cached .env
git commit -m "Remove .env file"
git push
```

И **обязательно** измените все токены и ключи!

## 📝 Обновление кода

В будущем для загрузки изменений:

```bash
git add .
git commit -m "Описание изменений"
git push
```

---

Готово! Ваш бот теперь на GitHub 🎉
