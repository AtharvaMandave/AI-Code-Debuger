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

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object. No explanations, no markdown, no code blocks.
2. Keep the JSON simple and valid. Avoid complex nested structures.
3. Limit each description to 100 characters maximum.
4. Limit each codeSnippet to 200 characters maximum.
5. Use only basic JSON types (strings, numbers, booleans, arrays, objects).

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

IMPORTANT: Keep the response simple and ensure valid JSON. Do not include any text outside the JSON object.`;

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
    
    console.log('Raw AI response length:', content.length);
    console.log('Raw AI response preview:', content.substring(0, 300));
    
    // Extract JSON using shared utility
    let jsonText = extractJsonFromMarkdown(content);
    
    console.log('Extracted JSON length:', jsonText.length);
    console.log('Extracted JSON preview:', jsonText.substring(0, 300));
    
    // Truncate if too large
    jsonText = truncateJsonIfNeeded(jsonText);
    
    console.log('After truncation length:', jsonText.length);
    
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
    
    // Additional validation for structure visualizer
    if (!structureData || !structureData.timeline || !Array.isArray(structureData.timeline)) {
      console.log('Invalid structure data, using fallback');
      return res.status(200).json(fallbackData);
    }
    
    // Ensure each timeline item has required fields
    const validatedTimeline = structureData.timeline.map((item, index) => ({
      step: item.step || index,
      type: item.type || "unknown",
      description: item.description || "Code structure step",
      lineNumber: item.lineNumber || 1,
      codeSnippet: item.codeSnippet || "// Code snippet",
      variables: item.variables || {}
    }));
    
    const finalData = {
      timeline: validatedTimeline
    };
    
    console.log('Final structure data:', JSON.stringify(finalData, null, 2));

    return res.status(200).json(finalData);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 