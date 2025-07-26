export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI code visualizer system. Your job is to instrument any user-provided code with visual tracer hooks that help in visualizing code execution and data structures step-by-step.\n\nThe user can paste code in Python, and your task is to:\n1. Parse the code and understand its logic.\n2. Identify key constructs like:\n   - Variables and assignments\n   - Loops (for, while)\n   - Conditionals (if, else)\n   - Function definitions and calls\n   - Data structures like arrays, lists, stacks, queues, trees, linked lists, etc.\n3. Insert tracing hooks to visualize:\n   - Variable value updates\n   - Flow of control (line-by-line execution)\n   - Changes in data structures\n4. Output instrumented code using Algorithm Visualizer's Tracer API (e.g., Array1DTracer, LinkedListTracer, ChartTracer, etc.).\n\nUse appropriate Tracer types for the data structures used in the code.\n\nInput:\n\n\`\`\`python\n${code}\n\`\`\`\n\nOutput:\n\n\`\`\`js\n// Instrumented JavaScript code using Tracer API\n// ...instrumented code here...\n\`\`\``;

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
    // Try to extract JS code from code block
    const codeBlockMatch = content.match(/```js[\s\S]*?([\s\S]*?)```/i);
    let instrumentedCode = '';
    if (codeBlockMatch) {
      instrumentedCode = codeBlockMatch[1].trim();
    } else {
      instrumentedCode = content.trim();
    }
    return res.status(200).json({ instrumentedCode });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 