import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  // Compose prompt for Gemini
  const prompt = `You are an expert code visualizer. Given the following ${language || 'code'} snippet, do the following:\n\n1. Detect if the code uses any of these data structures: Array, Linked List, Stack, Queue, Binary Tree, Graph.\n2. For each detected structure, track its state at key points in the code's execution (e.g., after each insertion, deletion, or update).\n3. For each key point, output:\n  - structure_type (e.g., 'array', 'linked_list', etc.)\n  - state (the contents/shape of the structure, e.g., array values, linked list nodes, tree nodes, etc.)\n  - code_line (the line number in the code related to this change)\n  - operation (insert, delete, update, etc.)\n4. Output a JSON array called 'timeline', where each element is:\n{\n  "structure_type": "array|linked_list|stack|queue|binary_tree|graph",\n  "state": {...},\n  "code_line": 12,\n  "operation": "insert|delete|update|..."\n}\n\nCode:\n${code}\n\nRespond ONLY with a JSON object:\n{\n  "timeline": [ ... ]\n}`;

  try {
    // Get Clerk user ID (optional, for auth)
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Call Gemini API
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
    let timelineJson;
    try {
      timelineJson = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse Gemini response', details: content });
    }
    return res.status(200).json(timelineJson);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 