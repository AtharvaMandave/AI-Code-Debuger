import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: 'No input provided' });
  }

  // Compose Gemini prompt
  const prompt = `You are a code assistant that suggests helpful YouTube videos and documentation links for a developer's code or error message.\n\nInput: ${input}\n\nYour tasks:\n1. Understand the topic or issue from the code or error.\n2. Suggest:\n   - 3 relevant YouTube video titles and links (tutorials, fixes, or explanations)\n   - 2–3 official documentation or Stack Overflow links related to the topic or bug\n\nMake sure all resources are beginner-friendly and reliable.\n\nRespond in this exact JSON format:\n{\n  "youtube": [ { "title": "...", "url": "..." }, ... ],\n  "docs": [ "...", ... ]\n}`;

  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [ { parts: [ { text: prompt } ] } ]
      }),
    });
    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }
    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to extract JSON from code block or text
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      content = codeBlockMatch[1];
    }
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse Gemini response', details: content });
    }
    return res.status(200).json(suggestions);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 