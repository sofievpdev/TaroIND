const { tarotCards } = require('../data/tarotCards');

class TarotService {
  // Перемешивание массива (Fisher-Yates shuffle)
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Вытягивание случайных карт
  drawCards(count) {
    const shuffled = this.shuffleArray(tarotCards);
    return shuffled.slice(0, count);
  }

  // Форматирование карты для отображения
  formatCard(card, position) {
    return `🃏 ${position}: ${card.name}\n📖 ${card.keywords}`;
  }

  // Форматирование всего расклада
  formatSpread(cards, spreadType) {
    let result = `✨ ${spreadType.name} ✨\n\n`;

    cards.forEach((card, index) => {
      result += this.formatCard(card, spreadType.positions[index]) + '\n\n';
    });

    return result;
  }
}

module.exports = TarotService;
