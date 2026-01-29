const fs = require('fs').promises;
const path = require('path');

class UserStorage {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/users.json');
    this.users = new Map();
    this.initialized = false;
  }

  // Инициализация и загрузка данных
  async init() {
    if (this.initialized) return;

    try {
      // Создаем директорию если не существует
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });

      // Пытаемся загрузить данные
      const data = await fs.readFile(this.dataPath, 'utf8');
      const usersArray = JSON.parse(data);

      // Конвертируем в Map
      usersArray.forEach(user => {
        this.users.set(user.userId, user);
      });

      console.log(`Loaded ${this.users.size} users from storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Файл не существует - это нормально при первом запуске
        console.log('Creating new user storage file');
        await this.save();
      } else {
        console.error('Error loading user storage:', error);
      }
    }

    this.initialized = true;
  }

  // Сохранение данных в файл
  async save() {
    try {
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(this.dataPath, JSON.stringify(usersArray, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving user storage:', error);
    }
  }

  // Получить данные пользователя
  getUser(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        userId,
        readingsBalance: 0, // Баланс раскладов
        totalPurchases: 0,
        hasUsedFreeTrial: false, // Использовал ли бесплатный расклад
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }

    const user = this.users.get(userId);
    user.lastActivity = Date.now();
    return user;
  }

  // Проверить, доступен ли бесплатный расклад
  canUseFreeTrial(userId) {
    const user = this.getUser(userId);
    return !user.hasUsedFreeTrial;
  }

  // Использовать бесплатный расклад
  async useFreeTrial(userId) {
    const user = this.getUser(userId);
    user.hasUsedFreeTrial = true;
    await this.save();
    return true;
  }

  // Добавить расклады в баланс
  async addReadings(userId, count) {
    const user = this.getUser(userId);
    user.readingsBalance += count;
    user.totalPurchases += 1;
    await this.save();
    return user.readingsBalance;
  }

  // Использовать один расклад
  async useReading(userId) {
    const user = this.getUser(userId);
    if (user.readingsBalance > 0) {
      user.readingsBalance -= 1;
      await this.save();
      return true;
    }
    return false;
  }

  // Проверить баланс
  getBalance(userId) {
    const user = this.getUser(userId);
    return user.readingsBalance;
  }

  // Получить статистику
  getStats(userId) {
    const user = this.getUser(userId);
    return {
      balance: user.readingsBalance,
      totalPurchases: user.totalPurchases,
      memberSince: new Date(user.createdAt).toLocaleDateString('ru-RU')
    };
  }
}

module.exports = UserStorage;
