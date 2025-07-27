export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI algorithm visualizer. Analyze the given code and return ONLY a valid JSON object for visualization.

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks.

For the code below, create a visualization with this exact JSON structure:

{
  "algorithmType": "algorithm_name",
  "visualizationType": "sorting/searching/graph/etc",
  "sampleData": [1, 2, 3, 4, 5],
  "animationSteps": [
    {
      "step": 0,
      "action": "initialize",
      "description": "Brief description",
      "data": {
        "array": [1, 2, 3, 4, 5],
        "pointers": {},
        "highlighted": []
      },
      "duration": 1000
    }
  ],
  "config": {
    "speed": 1000,
    "autoPlay": false,
    "showPointers": true,
    "showComparisons": true
  }
}

CRITICAL REQUIREMENTS:
- Generate maximum 20 animation steps
- Keep descriptions brief and clear
- Include proper data structures for visualization
- Ensure all array indices are within bounds
- Check for potential infinite loops
- Validate loop termination conditions

Code to analyze:
${code}

Language: ${language}

Return ONLY the JSON object, nothing else. Ensure the algorithm runs to completion.`;

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
    jsonText = jsonText.replace(/,\s*}/g, '}');
    jsonText = jsonText.replace(/,\s*]/g, ']');
    jsonText = jsonText.replace(/,\s*$/g, '');
    
    // Handle common JSON formatting issues
    jsonText = jsonText.replace(/([^"\\])\s*\n\s*([^"\\])/g, '$1 $2');
    jsonText = jsonText.replace(/\s+/g, ' ');
    
    let visualizationData;
    try {
      visualizationData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse visualization data:', parseError.message);
      console.error('JSON text length:', jsonText.length);
      console.error('JSON text preview:', jsonText.substring(0, 500));
      
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
        visualizationData = JSON.parse(jsonText);
        console.log('JSON parse successful after cleaning');
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError.message);
        
        // Create fallback visualization data
        visualizationData = {
          algorithmType: "unknown",
          visualizationType: "sorting",
          sampleData: [1, 2, 3, 4, 5],
          animationSteps: [
            {
              step: 0,
              action: "initialize",
              description: "Unable to parse visualization data. Please try with a simpler algorithm.",
              data: {
                array: [1, 2, 3, 4, 5],
                pointers: {},
                highlighted: []
              },
              duration: 1000
            }
          ],
          config: {
            speed: 1000,
            autoPlay: false,
            showPointers: true,
            showComparisons: true
          }
        };
        console.log('Created fallback visualization data');
      }
    }

    // Validate and limit steps
    if (!visualizationData.animationSteps || visualizationData.animationSteps.length > 30) {
      visualizationData.animationSteps = visualizationData.animationSteps?.slice(0, 30) || [];
    }

    return res.status(200).json(visualizationData);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 