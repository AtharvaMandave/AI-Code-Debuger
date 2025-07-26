export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI algorithm debugger. Analyze the given code step-by-step and return ONLY a valid JSON object.

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks.

IMPORTANT LIMITATIONS:
- Generate maximum 10 steps (not 20!)
- Keep each step description very brief
- Focus on the most important steps only
- Ensure valid JSON syntax with no trailing commas

For the code below, create a step-by-step analysis with this exact JSON structure:

{
  "algorithmType": "algorithm_name",
  "totalSteps": number_of_steps,
  "steps": [
    {
      "stepIndex": 0,
      "stepType": "operation_type",
      "description": "Brief description",
      "lineNumber": line_number,
      "variables": {
        "var1": "value1"
      },
      "highlightedLines": [line_numbers]
    }
  ]
}

Example for simple algorithm (MAX 5 STEPS):
{
  "algorithmType": "bubble_sort",
  "totalSteps": 3,
  "steps": [
    {
      "stepIndex": 0,
      "stepType": "initialize",
      "description": "Initialize variables",
      "lineNumber": 1,
      "variables": {
        "arr": [5, 2, 8, 1]
      },
      "highlightedLines": [1]
    },
    {
      "stepIndex": 1,
      "stepType": "compare",
      "description": "Compare first two elements",
      "lineNumber": 4,
      "variables": {
        "arr": [5, 2, 8, 1],
        "i": 0
      },
      "highlightedLines": [4]
    }
  ]
}

Code to analyze:
${code}

Language: ${language}

Return ONLY the JSON object, nothing else. Keep it under 10 steps maximum.`;

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
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }
    
    // If no code block, try to extract the first {...} JSON object
    const jsonMatch = jsonText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Clean up the content more aggressively
    jsonText = jsonText.trim();
    jsonText = jsonText.replace(/\\n/g, '\n');
    jsonText = jsonText.replace(/\\"/g, '"');
    jsonText = jsonText.replace(/\\\\/g, '\\');
    jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove any trailing commas in arrays and objects
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    // Handle common JSON formatting issues
    jsonText = jsonText.replace(/([^"\\])\s*\n\s*([^"\\])/g, '$1 $2');
    jsonText = jsonText.replace(/\s+/g, ' ');
    
    // If the JSON is too large, truncate it to prevent parsing issues
    const MAX_JSON_SIZE = 10000; // 10KB limit
    if (jsonText.length > MAX_JSON_SIZE) {
      console.log(`JSON too large (${jsonText.length} chars), truncating...`);
      // Find the last complete step and truncate there
      const lastCompleteStep = jsonText.lastIndexOf('}, {');
      if (lastCompleteStep > 0) {
        jsonText = jsonText.substring(0, lastCompleteStep + 1) + ']';
      } else {
        // If we can't find a good truncation point, just take the first part
        jsonText = jsonText.substring(0, MAX_JSON_SIZE);
        // Try to close any open brackets
        const openBraces = (jsonText.match(/\{/g) || []).length;
        const closeBraces = (jsonText.match(/\}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;
        
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonText += '}';
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          jsonText += ']';
        }
      }
    }
    
    let debugSteps;
    try {
      debugSteps = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse debug steps response:', parseError.message);
      console.error('JSON text length:', jsonText.length);
      console.error('JSON text preview:', jsonText.substring(0, 500));
      console.error('JSON text end:', jsonText.substring(jsonText.length - 200));
      
      // Try to fix common JSON issues
      try {
        // Remove any text before the first {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace > 0) {
          jsonText = jsonText.substring(firstBrace);
        }
        
        // Remove any text after the last }
        const lastBrace = jsonText.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
          jsonText = jsonText.substring(0, lastBrace + 1);
        }
        
        // Additional cleaning for common issues
        jsonText = jsonText.replace(/,\s*}/g, '}'); // Remove trailing commas in objects
        jsonText = jsonText.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        jsonText = jsonText.replace(/,\s*$/g, ''); // Remove trailing commas at end
        
        console.log('Cleaned JSON preview:', jsonText.substring(0, 300));
        
        // Try parsing again
        debugSteps = JSON.parse(jsonText);
        console.log('JSON parse successful after cleaning');
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError.message);
        console.error('Error position:', secondError.message.match(/position (\d+)/)?.[1]);
        
        // Try to extract just the basic structure
        try {
          const algorithmMatch = jsonText.match(/"algorithmType":\s*"([^"]+)"/);
          const stepsMatch = jsonText.match(/"steps":\s*\[/);
          
          if (algorithmMatch && stepsMatch) {
            // Try to extract just the first few steps
            const stepsStart = jsonText.indexOf('"steps": [');
            const stepsEnd = jsonText.indexOf(']', stepsStart);
            
            if (stepsStart > 0 && stepsEnd > stepsStart) {
              const stepsSection = jsonText.substring(stepsStart, stepsEnd + 1);
              const cleanedSteps = stepsSection.replace(/,\s*$/g, '');
              
              debugSteps = {
                algorithmType: algorithmMatch[1],
                totalSteps: 1,
                steps: [
                  {
                    stepIndex: 0,
                    stepType: "execute",
                    description: "Parsed from partial response",
                    lineNumber: null,
                    variables: {},
                    highlightedLines: []
                  }
                ]
              };
              console.log('Created partial debug steps structure');
            } else {
              throw new Error('Could not extract steps section');
            }
          } else {
            throw new Error('Could not extract basic structure');
          }
        } catch (extractError) {
          console.error('Extraction failed:', extractError.message);
          
          // Last resort: create a basic debug steps structure
          debugSteps = {
            algorithmType: "unknown",
            totalSteps: 1,
            steps: [
              {
                stepIndex: 0,
                stepType: "execute",
                description: "Code analysis completed. The algorithm is too complex for detailed step-by-step debugging. Try using a simpler algorithm or the regular 'Debug' feature for code analysis.",
                variables: {},
                highlightedLines: []
              }
            ]
          };
          console.log('Created fallback debug steps structure');
        }
      }
    }

    // Validate the structure
    if (!debugSteps || typeof debugSteps !== 'object') {
      throw new Error('Invalid debug steps structure');
    }
    
    if (!Array.isArray(debugSteps.steps)) {
      debugSteps.steps = [];
    }

    // Limit the number of steps to prevent UI issues
    const MAX_STEPS = 10;
    if (debugSteps.steps.length > MAX_STEPS) {
      console.log(`Too many steps (${debugSteps.steps.length}), limiting to ${MAX_STEPS}`);
      debugSteps.steps = debugSteps.steps.slice(0, MAX_STEPS);
      debugSteps.totalSteps = MAX_STEPS;
    }

    // Ensure all steps have required fields
    debugSteps.steps = debugSteps.steps.map((step, index) => ({
      stepIndex: index,
      stepType: step.stepType || 'execute',
      description: step.description || `Step ${index + 1}`,
      lineNumber: step.lineNumber || null,
      variables: step.variables || {},
      highlightedLines: step.highlightedLines || []
    }));

    return res.status(200).json(debugSteps);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 