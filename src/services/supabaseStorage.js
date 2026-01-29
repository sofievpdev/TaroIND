const { createClient } = require('@supabase/supabase-js');

class SupabaseStorage {
  constructor() {
    // Инициализация Supabase клиента
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not found, using local storage');
      this.supabase = null;
      this.users = new Map();
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase connected');
    }

    this.initialized = false;
  }

  // Инициализация
  async init() {
    if (this.initialized) return;

    if (!this.supabase) {
      console.log('Using local in-memory storage (dev mode)');
      this.initialized = true;
      return;
    }

    // Проверяем подключение к Supabase
    try {
      const { error } = await this.supabase.from('users').select('count').limit(1);
      if (error && error.code === '42P01') {
        console.log('⚠️ Table "users" does not exist. Creating...');
        // Таблица будет создана через SQL в Supabase Dashboard
      }
      console.log('✅ Supabase storage initialized');
    } catch (error) {
      console.error('Supabase init error:', error);
    }

    this.initialized = true;
  }

  // Получить данные пользователя
  async getUser(userId) {
    if (!this.supabase) {
      // Локальное хранилище для разработки
      if (!this.users.has(userId)) {
        this.users.set(userId, {
          userId,
          readingsBalance: 0,
          totalPurchases: 0,
          hasUsedFreeTrial: false,
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      const user = this.users.get(userId);
      user.lastActivity = Date.now();
      return user;
    }

    // Supabase хранилище
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Пользователь не найден - создаем нового
        const newUser = {
          user_id: userId,
          readings_balance: 0,
          total_purchases: 0,
          has_used_free_trial: false,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await this.supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        // Если ошибка дублирования (race condition) - пробуем получить пользователя еще раз
        if (createError && createError.code === '23505') {
          const { data: existingUser, error: retryError } = await this.supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (retryError) throw retryError;
          return this.formatUser(existingUser);
        }

        if (createError) throw createError;

        return this.formatUser(createdUser);
      }

      if (error) throw error;

      // Обновляем lastActivity
      await this.supabase
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', userId);

      return this.formatUser(data);
    } catch (error) {
      console.error('getUser error:', error);
      throw error;
    }
  }

  // Форматирование пользователя из Supabase формата
  formatUser(data) {
    return {
      userId: data.user_id,
      readingsBalance: data.readings_balance,
      totalPurchases: data.total_purchases,
      hasUsedFreeTrial: data.has_used_free_trial,
      createdAt: new Date(data.created_at).getTime(),
      lastActivity: new Date(data.last_activity).getTime()
    };
  }

  // Получить баланс
  async getBalance(userId) {
    const user = await this.getUser(userId);
    return user.readingsBalance;
  }

  // Проверить доступность бесплатного расклада
  async canUseFreeTrial(userId) {
    const user = await this.getUser(userId);
    return !user.hasUsedFreeTrial;
  }

  // Использовать бесплатный расклад
  async useFreeTrial(userId) {
    if (!this.supabase) {
      const user = this.users.get(userId);
      user.hasUsedFreeTrial = true;
      return true;
    }

    const { error } = await this.supabase
      .from('users')
      .update({ has_used_free_trial: true })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  // Добавить расклады в баланс
  async addReadings(userId, count) {
    if (!this.supabase) {
      const user = this.users.get(userId);
      user.readingsBalance += count;
      user.totalPurchases += 1;
      return user.readingsBalance;
    }

    const user = await this.getUser(userId);
    const newBalance = user.readingsBalance + count;
    const newPurchases = user.totalPurchases + 1;

    const { error } = await this.supabase
      .from('users')
      .update({
        readings_balance: newBalance,
        total_purchases: newPurchases
      })
      .eq('user_id', userId);

    if (error) throw error;
    return newBalance;
  }

  // Использовать один расклад
  async useReading(userId) {
    if (!this.supabase) {
      const user = this.users.get(userId);
      if (user.readingsBalance > 0) {
        user.readingsBalance -= 1;
        return true;
      }
      return false;
    }

    const user = await this.getUser(userId);
    if (user.readingsBalance <= 0) return false;

    const { error } = await this.supabase
      .from('users')
      .update({ readings_balance: user.readingsBalance - 1 })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  // Получить статистику
  async getStats(userId) {
    const user = await this.getUser(userId);
    return {
      balance: user.readingsBalance,
      totalPurchases: user.totalPurchases,
      memberSince: new Date(user.createdAt).toLocaleDateString('ru-RU')
    };
  }
}

module.exports = SupabaseStorage;
