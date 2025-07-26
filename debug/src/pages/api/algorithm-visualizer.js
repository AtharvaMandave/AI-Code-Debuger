export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI algorithm visualizer. Analyze the given code and detect the algorithm type, then generate visualization data with animation steps.

CRITICAL: Return ONLY a valid JSON object. No explanations, no markdown, no code blocks.

IMPORTANT:
- Detect algorithm type (bubble_sort, quick_sort, merge_sort, binary_search, linear_search, linked_list, binary_tree, dfs, bfs, etc.)
- Generate COMPLETE animation steps for visualization - ensure the algorithm runs to completion
- For sorting algorithms: continue until the array is fully sorted
- For search algorithms: continue until the target is found or search is complete
- For traversal algorithms: continue until all nodes are visited
- Keep steps under 30 for performance (but ensure completeness)
- Include sample data for visualization

For the code below, create visualization data with this exact JSON structure:

{
  "algorithmType": "algorithm_name",
  "visualizationType": "sorting|linked_list|binary_tree|graph|search",
  "sampleData": [1, 2, 3, 4, 5],
  "animationSteps": [
    {
      "step": 0,
      "action": "initialize|compare|swap|insert|traverse",
      "description": "What is happening",
      "data": {
        "array": [1, 2, 3, 4, 5],
        "pointers": {"i": 0, "j": 1},
        "highlighted": [0, 1]
      },
      "duration": 1000
    }
  ],
  "config": {
    "speed": 1000,
    "autoPlay": true,
    "showPointers": true,
    "showComparisons": true
  }
}

Example for COMPLETE bubble sort (showing full sorting process):
{
  "algorithmType": "bubble_sort",
  "visualizationType": "sorting",
  "sampleData": [64, 34, 25, 12, 22, 11, 90],
  "animationSteps": [
    {
      "step": 0,
      "action": "initialize",
      "description": "Initialize array",
      "data": {
        "array": [64, 34, 25, 12, 22, 11, 90],
        "pointers": {"i": 0, "j": 0},
        "highlighted": []
      },
      "duration": 500
    },
    {
      "step": 1,
      "action": "compare",
      "description": "Compare elements at positions 0 and 1",
      "data": {
        "array": [64, 34, 25, 12, 22, 11, 90],
        "pointers": {"i": 0, "j": 0},
        "highlighted": [0, 1]
      },
      "duration": 1000
    },
    {
      "step": 2,
      "action": "swap",
      "description": "Swap elements at positions 0 and 1",
      "data": {
        "array": [34, 64, 25, 12, 22, 11, 90],
        "pointers": {"i": 0, "j": 0},
        "highlighted": [0, 1]
      },
      "duration": 1000
    },
    {
      "step": 3,
      "action": "compare",
      "description": "Compare elements at positions 1 and 2",
      "data": {
        "array": [34, 64, 25, 12, 22, 11, 90],
        "pointers": {"i": 0, "j": 1},
        "highlighted": [1, 2]
      },
      "duration": 1000
    },
    {
      "step": 4,
      "action": "swap",
      "description": "Swap elements at positions 1 and 2",
      "data": {
        "array": [34, 25, 64, 12, 22, 11, 90],
        "pointers": {"i": 0, "j": 1},
        "highlighted": [1, 2]
      },
      "duration": 1000
    }
    // ... continue until array is fully sorted: [11, 12, 22, 25, 34, 64, 90]
  ],
  "config": {
    "speed": 1000,
    "autoPlay": true,
    "showPointers": true,
    "showComparisons": true
  }
}

CRITICAL REQUIREMENTS:
- For sorting algorithms: Continue until the array is COMPLETELY sorted
- For bubble sort: Show all passes until no more swaps are needed
- For other algorithms: Show the complete execution until termination
- Ensure the final step shows the sorted/complete result

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
    
    // Clean up the content
    jsonText = jsonText.trim();
    jsonText = jsonText.replace(/\\n/g, '\n');
    jsonText = jsonText.replace(/\\"/g, '"');
    jsonText = jsonText.replace(/\\\\/g, '\\');
    jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    jsonText = jsonText.replace(/,\s*}/g, '}');
    jsonText = jsonText.replace(/,\s*]/g, ']');
    jsonText = jsonText.replace(/,\s*$/g, '');
    
    let visualizationData;
    try {
      visualizationData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse visualization data:', parseError.message);
      
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