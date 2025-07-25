import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { source_code, source_language, target_language } = req.body;
  if (!source_code || !source_language || !target_language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are an expert multilingual code translator.\n\nConvert the following code from ${source_language} to ${target_language}.\n\n- Preserve logic and structure\n- Use idiomatic syntax of the target language\n- If any feature doesn't exist in the target language, explain with comments\n- Output only the converted code, with comments where necessary\n\nSource Code:\n${source_code}`;

  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }),
    });

    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }

    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to extract code block
    let translated_code = content;
    const match = content.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    if (match) {
      translated_code = match[1].trim();
    }
    return res.status(200).json({ translated_code });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 