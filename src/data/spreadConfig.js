// Spread types and pricing configuration
const spreadTypes = {
  // PACKAGE - special offer
  package5: {
    id: 'package_5',
    name: '🎁 Package of 5 Readings',
    description: 'BEST VALUE! 5 readings for the price of 4. Use for any questions.',
    isPackage: true,
    readingsCount: 5,
    price: 8, // Stars - save 22⭐!
    originalPrice: 30
  },
  oneCard: {
    id: 'one_card',
    name: '🌟 One Card',
    description: 'Quick and precise answer to your question. Card of the day or advice from the Universe.',
    cards: 1,
    price: 2, // Stars
    positions: ['Answer']
  },
  threeCards: {
    id: 'three_cards',
    name: '🔮 Three Cards',
    description: 'Classic spread: Past → Present → Future. See how your situation unfolds.',
    cards: 3,
    price: 4, // Stars
    positions: ['Past', 'Present', 'Future']
  },
  loveReading: {
    id: 'love_reading',
    name: '💖 Love Reading',
    description: '5 cards about love: You → Partner → Connection → What helps → What hinders.',
    cards: 5,
    price: 6, // Stars
    positions: [
      'You in the relationship',
      'Partner in the relationship',
      'Connection between you',
      'What helps',
      'What hinders'
    ]
  },
  compatibilityReading: {
    id: 'compatibility_reading',
    name: '💞 Compatibility Reading',
    description: '5 cards reveal your compatibility: Your energy → Their energy → Strengths → Challenges → Potential.',
    cards: 5,
    price: 6, // Stars
    positions: [
      'Your energy',
      'Their energy',
      'Strengths together',
      'Challenges to overcome',
      'Future potential'
    ]
  },
  celticCross: {
    id: 'celtic_cross',
    name: '✨ Celtic Cross',
    description: 'Deep 10-card spread: situation, obstacles, past, future, outcome + hidden influences.',
    cards: 10,
    price: 10, // Stars
    positions: [
      'Current situation',
      'Obstacle',
      'Root of the matter',
      'Recent past',
      'Possible future',
      'Near future',
      'Your attitude',
      'External influences',
      'Hopes and fears',
      'Outcome'
    ]
  }
};

module.exports = { spreadTypes };
