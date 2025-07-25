import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { code } = req.body;

  const prompt = `Given the following Python code, produce a step-by-step execution trace as a JSON array. Each step should include: line (number), code (string, the code at that line), variables (object, variable state at that point), description (string, what is happening at this step). Python code:\n${code}\nRespond ONLY with a valid JSON array as described.`;

  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract JSON array from the response
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    const jsonString = text.substring(start, end + 1);
    const execution_trace = JSON.parse(jsonString);
    res.status(200).json({ execution_trace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate execution trace.' });
  }
} 