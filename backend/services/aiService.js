const { GoogleGenAI } = require('@google/genai');
const pdfParse = require('pdf-parse');
// Note: LangChain imports if needed, but basic pdf-parse and gemini api might be sufficient and cleaner.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractText = async (file) => {
  let text = '';
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    text = data.text;
  } else if (file.mimetype === 'text/plain') {
    text = file.buffer.toString('utf-8');
  } else {
    // For PPTX, might need a separate library like mammoth or officeparser
    // For now, text and pdf are supported
    throw new Error('Unsupported format for text extraction');
  }
  return text;
};

const generateQuizFromText = async (text, numQuestions = 10) => {
  const prompt = `You are an expert teacher. Generate ${numQuestions} multiple choice questions from the given content. Each question must have 4 options, one correct answer, and a comprehensive explanation. The explanation MUST explicitly state why the correct answer is right AND briefly explain why the other options are incorrect. Do not simply restate the question. Output in strict JSON format.

  Content:
  ${text}

  Output Format:
  [
    {
      "question": "Question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "explanation": "Explanation here"
    }
  ]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const responseText = response.text;
  
  // Extract JSON from response (handling potential markdown code blocks)
  try {
    let cleanJson = responseText;
    if (responseText.includes('\`\`\`json')) {
      cleanJson = responseText.split('\`\`\`json')[1].split('\`\`\`')[0];
    } else if (responseText.includes('\`\`\`')) {
      cleanJson = responseText.split('\`\`\`')[1].split('\`\`\`')[0];
    }
    
    return JSON.parse(cleanJson.trim());
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", responseText);
    throw new Error('Failed to generate valid quiz format from AI');
  }
};

const generateExplanation = async (question, options, userAnswer, correctAnswer, studyMaterial) => {
  const prompt = `You are an expert tutor providing concise feedback on incorrect quiz answers. Your response must be strictly factual, analytical, and devoid of conversational filler.

Output Format Requirements:
1. Limit your response to exactly two sentences.
2. First Sentence: Identify the specific misconception in the user's selected incorrect answer.
3. Second Sentence: Provide the correct answer and the factual reasoning behind it.

Negative Constraints (Do NOT violate these):
- DO NOT restate, copy, or quote the original question.
- DO NOT use phrases like "The correct answer is..." or "Your answer was wrong because..."
- DO NOT be conversational or friendly. Be blunt and objective.
- If the correct answer is "All of the above," explicitly state why the multiple components combined are the correct definition.

---

INPUT FORMAT:
Question: ${question}
Options: ${JSON.stringify(options || [])}
User Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Context: ${studyMaterial || 'Not provided'}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text.trim();
  if (text === 'null') return null;
  return text;
};

module.exports = {
  extractText,
  generateQuizFromText,
  generateExplanation
};
