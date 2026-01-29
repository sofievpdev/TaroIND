const OpenAI = require('openai');

class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey
    });
  }

  // Create mystical prompt for Tarot reading
  createTarotPrompt(spreadType, cards, userQuestion) {
    const cardDescriptions = cards.map((card, index) => {
      return `Position ${index + 1} (${spreadType.positions[index]}): ${card.name} (${card.nameEn})
Keywords: ${card.keywords}
Upright meaning: ${card.upright}
Reversed meaning: ${card.reversed}`;
    }).join('\n\n');

    const prompt = `You are a wise spiritual guide with deep knowledge of Tarot. The Universe speaks through signs and cards. Your task is to give a profound, insightful interpretation that SPECIFICALLY answers the client's question.

Reading type: ${spreadType.name}
Description: ${spreadType.description}

Client's question: "${userQuestion || 'What do I need to know right now?'}"

Cards drawn:
${cardDescriptions}

IMPORTANT: The client's question is paramount. The entire reading must answer it directly. If they ask "will I travel to Dubai" - give a concrete answer based on the cards!

Create a detailed interpretation with this structure:

1. ✨ SPIRITUAL OPENING ✨
Address the client with spiritual wisdom (2-3 sentences). Mention how the Universe speaks through signs.

2. 🔮 CARD INTERPRETATION 🔮
Describe each card in context of its position and the client's question. Use spiritual language and metaphors, but speak SPECIFICALLY about the situation.

3. 🌙 ANSWER TO THE QUESTION 🌙
THIS IS MOST IMPORTANT! Give a CLEAR and SPECIFIC answer to the client's question based on the cards.
- If yes/no question (will I travel, will I get, will it happen) - answer: "Yes" or "No" or "Likely yes/no", explain why
- If "when" question - indicate approximate timing
- If "what will happen" - describe what exactly will occur
- If "how" question - give concrete steps

4. 💫 DIVINE GUIDANCE 💫
What should the client do, how to use this wisdom. Specific actions.

Style:
- Warm spiritual tone, BUT with concrete answers
- Use metaphors about Universe, destiny, cosmic energy, but always return to the core question
- Write in second person ("you", "your")
- Be profound, insightful and SPECIFIC
- Use emojis: ✨ 🌙 ⭐ 🔮 💫
- DO NOT use markdown formatting (bold text, italics)

CRITICALLY IMPORTANT: Your answer must give the client a clear understanding of the answer to their question, not just general abstract thoughts!`;

    return prompt;
  }

  // Get reading from ChatGPT
  async getTarotReading(spreadType, cards, userQuestion) {
    try {
      const prompt = this.createTarotPrompt(spreadType, cards, userQuestion);

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini", // Using more accessible model
        messages: [
          {
            role: "system",
            content: "You are a wise spiritual guide with profound knowledge of Tarot. The Universe speaks to you through signs. Your interpretations are deep, insightful and always hit the mark. You speak with spiritual wisdom, yet clearly, and ALWAYS give concrete answers to the client's questions. You don't get lost in abstractions - you answer clearly what is being asked. If they ask 'will I travel to Dubai' - you give an answer 'yes', 'no' or 'likely', based on the cards."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7, // Slightly less creativity for more concrete answers
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Unable to get reading. Please try later.');
    }
  }
}

module.exports = OpenAIService;
