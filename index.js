const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/extract-chapters', async (req, res) => {
  const { uploadedText } = req.body;
  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Extract all section or chapter names from this study material. Return a JSON array of strings only, like ["Chapter 1: Demand", "Chapter 2: Supply"]:

${uploadedText}`
      }]
    });
    const chapters = JSON.parse(chat.choices[0].message.content);
    res.json({ chapters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not extract chapters' });
  }
});

app.post('/api/study', async (req, res) => {
  const { uploadedText, chapterWeights, studyTime } = req.body;
  try {
    const prompt = `You are an AI study assistant. Use these user notes and the weighting and time they provided to generate a complete review. Also, generate 10 multiple choice questions with 4 answer options each, drawn from the content and expanded with your knowledge. Include questions from each weighted section and follow the tone of textbook exams. Here are the notes:

${uploadedText}

Weights: ${JSON.stringify(chapterWeights)}
Study time: ${studyTime} minutes`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = chat.choices[0].message.content;
    const questions = [
      {
        question: "What does the law of demand state?",
        options: ["As price increases, quantity demanded increases", "As price increases, quantity demanded decreases", "Demand is constant regardless of price", "Supply affects demand directly"],
        correct: "As price increases, quantity demanded decreases"
      }
    ];

    res.json({ response: content, quizQuestions: questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Study generation failed' });
  }
});

app.listen(5000, () => console.log('StudyBuddy backend running on port 5000'));
