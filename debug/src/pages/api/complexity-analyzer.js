// Utility to robustly extract JSON from Markdown code block or plain text
function extractJsonFromMarkdown(content) {
  if (!content) return '';
  // Try to extract the first code block (with or without 'json')
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  }
  // If no code block, try to extract the first {...} JSON object
  const jsonMatch = content.match(/{[\s\S]*}/);
  if (jsonMatch) {
    content = jsonMatch[0];
  }
  // Clean up the content - handle escaped characters
  content = content.trim();
  // Replace escaped newlines and quotes that might cause parsing issues
  content = content.replace(/\\n/g, '\n');
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\\\/g, '\\');
  // Handle control characters that break JSON parsing
  content = content.replace(/\r/g, ''); // Remove carriage returns
  content = content.replace(/\t/g, ' '); // Replace tabs with spaces
  content = content.replace(/\f/g, ''); // Remove form feeds
  content = content.replace(/\b/g, ''); // Remove backspace characters
  // Clean up any remaining problematic characters in string literals
  content = content.replace(/(?<="[^"]*)[^\x20-\x7E](?=[^"]*")/g, ' ');
  // Remove trailing commas that cause JSON parsing issues
  content = content.replace(/,(\s*[}\]])/g, '$1');
  content = content.replace(/,(\s*})/g, '$1');
  return content;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI complexity analyzer. Analyze the given code and return ONLY a valid JSON object with time and space complexity analysis.

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks.

For the code below, analyze and return this exact JSON structure:

{
  "timeComplexity": "O(n^2)",
  "spaceComplexity": "O(1)",
  "explanation": "Brief explanation of complexity analysis",
  "optimizationSuggestions": ["suggestion1", "suggestion2"],
  "improvedCode": "optimized code here",
  "improvementExplanation": "explanation of improvements"
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
    
    // Try to extract JSON from code block or text
    let jsonText = content;
    jsonText = extractJsonFromMarkdown(jsonText);
    
    // Debug: Log the extracted JSON for troubleshooting
    console.log('Extracted JSON length:', jsonText.length);
    console.log('Extracted JSON preview:', jsonText.substring(0, 200));
    
    let analysis;
    try {
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      // Try to clean more aggressively
      let cleanedJson = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      try {
        analysis = JSON.parse(cleanedJson);
        console.log('JSON parse successful after cleaning');
      } catch (secondError) {
        console.log('Second parse attempt failed:', secondError.message);
        
        // Last resort: try to extract basic fields manually
        const timeMatch = jsonText.match(/"timeComplexity":\s*"([^"]*)"/);
        const spaceMatch = jsonText.match(/"spaceComplexity":\s*"([^"]*)"/);
        const explanationMatch = jsonText.match(/"explanation":\s*"([^"]*)"/);
        const suggestionsMatch = jsonText.match(/"optimizationSuggestions":\s*\[(.*?)\]/);
        const improvedCodeMatch = jsonText.match(/"improvedCode":\s*"([\s\S]*?)"(,|})/);
        const improvementExplanationMatch = jsonText.match(/"improvementExplanation":\s*"([^"]*)"/);
        
        analysis = {
          timeComplexity: timeMatch ? timeMatch[1] : 'unknown',
          spaceComplexity: spaceMatch ? spaceMatch[1] : 'unknown',
          explanation: explanationMatch ? explanationMatch[1] : 'Unable to parse complexity analysis. Please try with a simpler algorithm.',
          optimizationSuggestions: suggestionsMatch ? suggestionsMatch[1].split(',').map(s => s.replace(/(^\s*"|"\s*$)/g, '')) : [],
          improvedCode: improvedCodeMatch ? improvedCodeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
          improvementExplanation: improvementExplanationMatch ? improvementExplanationMatch[1] : ''
        };
        console.log('Manual extraction successful');
      }
    }
    
    return res.status(200).json(analysis);
  } catch (e) {
    console.error('Failed to parse Gemini response:', e.message);
    return res.status(500).json({ 
      error: 'Failed to parse Gemini response', 
      details: e.message, 
      contentPreview: content.substring(0, 200) + '...', 
      contentLength: content.length 
    });
  }
} 