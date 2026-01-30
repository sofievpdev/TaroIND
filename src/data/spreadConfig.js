// Spread types and pricing configuration
const spreadTypes = {
  // PACKAGE - special offer
  package5: {
    id: 'package_5',
    name: '🎁 Sacred Bundle - 5 Divine Messages',
    description: 'BLESSED OFFER! Save 22⭐ and unlock 5 spiritual readings. The Universe rewards your faith!',
    isPackage: true,
    readingsCount: 5,
    price: 8, // Stars - save 22⭐!
    originalPrice: 30
  },
  oneCard: {
    id: 'one_card',
    name: '🌟 One Card - Divine Guidance',
    description: 'Instant wisdom from the Universe. Your destiny revealed in a single card.',
    cards: 1,
    price: 2, // Stars
    positions: ['Divine Answer']
  },
  quickDecision: {
    id: 'quick_decision',
    name: '⚖️ Quick Decision',
    description: 'Yes or No? One card reveals a clear answer before you make your choice.',
    cards: 1,
    price: 1, // Stars
    positions: ['Answer: Yes or No']
  },
  threeCards: {
    id: 'three_cards',
    name: '🔮 Three Cards - Destiny Path',
    description: 'Witness your journey: Past karma → Present reality → Future destiny unfolds before you.',
    cards: 3,
    price: 4, // Stars
    positions: ['Past Karma', 'Present Reality', 'Future Destiny']
  },
  loveReading: {
    id: 'love_reading',
    name: '💖 Love Reading - Heart\'s Truth',
    description: 'Will they be yours? 5 sacred cards reveal the cosmic truth about your relationship.',
    cards: 5,
    price: 6, // Stars
    positions: [
      'Your heart energy',
      'Their heart energy',
      'Soul connection',
      'Blessings & support',
      'Obstacles to overcome'
    ]
  },
  compatibilityReading: {
    id: 'compatibility_reading',
    name: '💞 Compatibility - Soul Match',
    description: 'Are your souls destined to unite? The Universe reveals if they are meant for you.',
    cards: 5,
    price: 6, // Stars
    positions: [
      'Your spiritual essence',
      'Their spiritual essence',
      'Karmic bond strength',
      'Challenges ahead',
      'Destiny together'
    ]
  },
  celticCross: {
    id: 'celtic_cross',
    name: '✨ Celtic Cross - Complete Destiny',
    description: 'The most powerful reading! 10 cards unlock ALL secrets: past karma, hidden forces, final outcome.',
    cards: 10,
    price: 10, // Stars
    positions: [
      'Present moment',
      'Challenge crossing you',
      'Deep root cause',
      'Past influences',
      'Highest potential',
      'Near future',
      'Your inner power',
      'External forces',
      'Hopes and fears',
      'Final outcome'
    ]
  }
};

module.exports = { spreadTypes };
