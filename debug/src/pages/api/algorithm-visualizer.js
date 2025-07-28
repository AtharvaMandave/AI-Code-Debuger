export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { code, language = 'javascript' } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const prompt = `Analyze the following ${language} code and create a comprehensive step-by-step visualization. 

Code:
${code}

Requirements:
1. Detect the algorithm type (sorting, tree traversal, graph algorithm, linked list, matrix operations, etc.)
2. Extract meaningful data structures (arrays, nodes, variables, etc.)
3. Create detailed animation steps showing the algorithm's execution
4. Include proper highlighting, pointers, and state changes
5. Make it educational and visually appealing
6. Handle any type of code - be creative and intelligent

For different algorithm types:
- Sorting: Show array changes, comparisons, swaps
- Trees: Show node traversal, highlighting current node, clear parent-child relationships
- Graphs: Show node visits, path finding, edge traversal, adjacency lists
- Linked Lists: Show pointer movements, node connections
- Matrix: Show grid operations, path finding
- Variables: Show variable state changes
- Any other: Be creative and appropriate

For TREE algorithms specifically:
- Create a proper tree structure with clear parent-child relationships
- Show the traversal path step by step
- Highlight the current node being processed
- Track visited nodes
- Show the final traversal sequence
- Make it clear which traversal method is being used (inorder, preorder, postorder)

For GRAPH algorithms specifically:
- Create proper nodes and edges structure
- Show node visits step by step
- Highlight current node being processed
- Track visited nodes
- Show path finding or traversal
- Include adjacency lists or matrix if relevant
- Make edges clear and directional if needed

Respond with a JSON object in this exact format:
{
  "algorithmType": "detected_algorithm_type",
  "visualizationType": "array|tree|graph|linked_list|matrix|variables",
  "animationSteps": [
    {
      "step": 0,
      "action": "initialize",
      "description": "Step description",
      "data": {
        "array": [1, 2, 3] // for arrays
        "nodes": [{"value": 1, "id": 0}, {"value": 2, "id": 1}] // for trees/graphs
        "edges": [{"from": 0, "to": 1}, {"from": 1, "to": 2}] // for graphs
        "variables": {"i": 0, "sum": 0} // for variable tracking
        "highlighted": [0], // current node being processed
        "visited": [0], // nodes already visited
        "traversal": ["1"], // current traversal path
        "pointers": {"i": 0, "j": 1}, // for sorting
        "comparisons": ["1 < 2"], // for sorting
        "path": [0, 1, 2] // for graph pathfinding
      }
    }
  ],
  "config": {
    "autoPlay": true,
    "speed": 1000
  }
}

For tree traversals, ensure:
- Each node has proper left/right child references
- Highlight the current node being processed
- Track visited nodes
- Show the traversal sequence building up
- Make the tree structure clear and hierarchical

For graph algorithms, ensure:
- Each node has a unique id and value
- Edges clearly show connections between nodes
- Highlight the current node being processed
- Track visited nodes
- Show path finding or traversal sequence
- Include adjacency information if relevant

Be creative and make the visualization engaging and educational. Include at least 5-15 meaningful steps.`;

    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }),
    });
    
    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      content = codeBlockMatch[1];
    }
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    // Clean JSON
    content = content.trim()
      .replace(/\n/g, '\n')
      .replace(/\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*$/g, '');
    
    try {
      const visualization = JSON.parse(content);
      
      // Validate required fields
      if (!visualization.algorithmType || !visualization.animationSteps || !Array.isArray(visualization.animationSteps)) {
        throw new Error('Missing required fields in visualization data');
      }
      
      // Ensure animationSteps have proper structure
      visualization.animationSteps = visualization.animationSteps.map((step, index) => ({
        step: index,
        action: step.action || 'execute',
        description: step.description || `Step ${index + 1}`,
        data: step.data || {}
      }));
      
      // Auto-detect visualization type if not provided
      if (!visualization.visualizationType) {
        const firstStep = visualization.animationSteps[0];
        if (firstStep.data.array) {
          visualization.visualizationType = 'array';
        } else if (firstStep.data.nodes) {
          if (firstStep.data.edges) {
            visualization.visualizationType = 'graph';
          } else {
            visualization.visualizationType = 'tree';
          }
        } else if (firstStep.data.variables) {
          visualization.visualizationType = 'variables';
        } else if (firstStep.data.matrix) {
          visualization.visualizationType = 'matrix';
        } else {
          visualization.visualizationType = 'array'; // fallback
        }
      }
      
      return res.status(200).json(visualization);
      
    } catch (parseError) {
      console.error('Failed to parse visualization:', parseError);
      
      // Create a fallback visualization
      const fallbackVisualization = {
        algorithmType: 'code_analysis',
        visualizationType: 'variables',
        animationSteps: [
          {
            step: 0,
            action: 'analyze',
            description: 'Analyzing code structure...',
            data: {
              variables: {
                'code_length': code.length,
                'language': language,
                'has_functions': code.includes('function'),
                'has_loops': code.includes('for') || code.includes('while'),
                'has_conditionals': code.includes('if') || code.includes('else')
              }
            }
          },
          {
            step: 1,
            action: 'extract',
            description: 'Extracting data structures...',
            data: {
              variables: {
                'arrays': (code.match(/\[/g) || []).length,
                'objects': (code.match(/{/g) || []).length,
                'strings': (code.match(/"/g) || []).length / 2,
                'numbers': (code.match(/\d+/g) || []).length
              }
            }
          }
        ],
        config: {
          autoPlay: true,
          speed: 1000
        }
      };
      
      return res.status(200).json(fallbackVisualization);
    }
    
  } catch (e) {
    console.error('Error generating visualization:', e);
    return res.status(500).json({ error: e.message });
  }
} 