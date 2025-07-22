// import fetch from 'node-fetch'; // Not needed in Next.js API routes (Node 18+)
import dbConnect from '../../lib/db';
import Snippet from '../../models/Snippet';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs\nSuggest corrections\nExplain in plain English\nBreak down line-by-line\nReturn a flowchart-friendly JSON of code logic\n\nCode:\n${code}\n\nRespond in JSON:\n{\n"explanation": "...",\n"bugs_detected": true,\n"issues": [],\n"suggested_fix": "...",\n"line_by_line": {},\n"visualization": {\n"nodes": [...],\n"edges": [...]\n}\n}`;

  try {
    // Gemini API endpoint and payload
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
      console.error('Gemini API error:', error);
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }

    const data = await geminiRes.json();
    let aiResponse;
    let content = '';
    try {
      // Gemini's response structure
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to extract JSON from code block or text
      let jsonText = content;
      // Remove markdown code fences if present
      const match = content.match(/```(?:json)?([\s\S]*?)```/i);
      if (match) {
        jsonText = match[1].trim();
      } else {
        // Try to find the first {...} block
        const curly = content.match(/({[\s\S]*})/);
        if (curly) jsonText = curly[1];
      }
      aiResponse = JSON.parse(jsonText);
      // Normalize issues to array of strings for frontend compatibility
      if (Array.isArray(aiResponse.issues)) {
        aiResponse.issues = aiResponse.issues.map(issue => {
          if (typeof issue === 'string') return issue;
          if (typeof issue === 'object' && issue !== null) {
            return issue.description || JSON.stringify(issue);
          }
          return String(issue);
        });
      }
    } catch (e) {
      console.error('Failed to parse Gemini response:', {data, content});
      return res.status(500).json({ error: 'Failed to parse Gemini response', details: data, content, parseError: e.message });
    }

    // Save to MongoDB
    try {
      await dbConnect();
      await Snippet.create({
        code,
        language: language || 'unknown',
        aiResponse,
        createdAt: new Date(),
      });
    } catch (dbErr) {
      // Log and return error
      console.error('MongoDB save error:', dbErr);
      return res.status(500).json({ error: 'MongoDB save error', details: dbErr.message });
    }

    return res.status(200).json(aiResponse);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 