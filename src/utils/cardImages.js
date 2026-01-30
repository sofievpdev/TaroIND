// Utility for generating Tarot card image URLs
// Using Rider-Waite deck images from a reliable CDN

/**
 * Generates image URL for a tarot card
 * @param {Object} card - Card object with nameEn property
 * @returns {string} URL to card image
 */
function getCardImageUrl(card) {
  // Map card names to image filenames
  const cardSlug = card.nameEn
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Using GitHub-hosted Rider-Waite images
  const baseUrl = 'https://raw.githubusercontent.com/ekelen/tarot-api/main/static/card-images';

  return `${baseUrl}/${cardSlug}.jpg`;
}

/**
 * Alternative: Get card image from sacred-texts.com
 * This provides Rider-Waite deck images in public domain
 */
function getCardImageUrlAlt(card) {
  // Map for major arcana
  const majorArcana = {
    'The Fool': 'ar00',
    'The Magician': 'ar01',
    'The High Priestess': 'ar02',
    'The Empress': 'ar03',
    'The Emperor': 'ar04',
    'The Hierophant': 'ar05',
    'The Lovers': 'ar06',
    'The Chariot': 'ar07',
    'Strength': 'ar08',
    'The Hermit': 'ar09',
    'Wheel of Fortune': 'ar10',
    'Justice': 'ar11',
    'The Hanged Man': 'ar12',
    'Death': 'ar13',
    'Temperance': 'ar14',
    'The Devil': 'ar15',
    'The Tower': 'ar16',
    'The Star': 'ar17',
    'The Moon': 'ar18',
    'The Sun': 'ar19',
    'Judgement': 'ar20',
    'The World': 'ar21'
  };

  // Map for minor arcana
  const suitMap = {
    'wands': 'wa',
    'cups': 'cu',
    'swords': 'sw',
    'pentacles': 'pe'
  };

  const rankMap = {
    'Ace': '01',
    'Two': '02',
    'Three': '03',
    'Four': '04',
    'Five': '05',
    'Six': '06',
    'Seven': '07',
    'Eight': '08',
    'Nine': '09',
    'Ten': '10',
    'Page': 'pa',
    'Knight': 'kn',
    'Queen': 'qu',
    'King': 'ki'
  };

  let filename;

  if (card.arcana === 'major') {
    filename = majorArcana[card.nameEn];
  } else {
    // Parse minor arcana name like "Two of Cups"
    const parts = card.nameEn.split(' of ');
    const rank = parts[0];
    const suit = parts[1]?.toLowerCase();

    if (suitMap[suit] && rankMap[rank]) {
      filename = `${suitMap[suit]}${rankMap[rank]}`;
    }
  }

  if (filename) {
    return `https://www.sacred-texts.com/tarot/pkt/img/${filename}.jpg`;
  }

  // Fallback to first method
  return getCardImageUrl(card);
}

module.exports = {
  getCardImageUrl,
  getCardImageUrlAlt
};
