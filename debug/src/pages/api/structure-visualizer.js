import { extractJsonFromMarkdown, parseJsonRobustly, truncateJsonIfNeeded } from '../../lib/json-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI code structure analyzer. Analyze the given code and return ONLY a valid JSON object showing the code structure timeline.

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks.

For the code below, create a structure timeline with this exact JSON structure:

{
  "timeline": [
    {
      "step": 0,
      "type": "function_definition",
      "description": "Brief description",
      "lineNumber": 1,
      "codeSnippet": "function code",
      "variables": {}
    }
  ]
}

Code to analyze:
${code}

Language: ${language}

Return ONLY the JSON object, nothing else.`;

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
      console.error('Gemini API error:', error);
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }

    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON using shared utility
    let jsonText = extractJsonFromMarkdown(content);
    
    // Truncate if too large
    jsonText = truncateJsonIfNeeded(jsonText);
    
    // Parse JSON using robust parser
    const fallbackData = {
      timeline: [
        {
          step: 0,
          type: "analysis",
          description: "Code structure analysis completed. The code is too complex for detailed structure analysis.",
          lineNumber: 1,
          codeSnippet: "// Structure analysis",
          variables: {}
        }
      ]
    };
    
    const structureData = parseJsonRobustly(jsonText, fallbackData);

    return res.status(200).json(structureData);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 