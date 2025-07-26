export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI code visualizer.\n\nGiven a code snippet (in Python), detect any standard data structures being defined or modified, and return a detailed JSON that describes their visual layout, including nodes, connections, and values.\n\nYour goal is to enable rendering of visuals like this:\n- Nodes with real data values (e.g., 1 → 2 → 3)\n- Arrows for next, prev, left, right, child, parent\n- Pointers or references (e.g., list.head, tail, null)\n- Support multiple structure types in the same code\n\nStructures to detect and return:\n- Arrays / Lists\n- Stacks / Queues (with push/pop/dequeue)\n- Linked Lists (singly/doubly)\n- Trees (Binary, BST, N-ary)\n- Graphs (adjacency list/matrix)\n\nOutput Format:\nReturn a JSON array of visual structures like this:\n{\n  "structures": [\n    {\n      "type": "SinglyLinkedList",\n      "language": "Python",\n      "label": "Linked List after insertions",\n      "pointers": { "head": "1", "tail": "4" },\n      "nodes": [ { "id": "1", "value": "10", "next": "2" }, ... ]\n    },\n    {\n      "type": "BinaryTree",\n      "language": "Python",\n      "label": "Binary Tree",\n      "nodes": [ { "id": "1", "value": "8", "left": "2", "right": "3" }, ... ]\n    },\n    {\n      "type": "Array",\n      "language": "Python",\n      "label": "Sorted Array",\n      "values": [1, 3, 5, 7, 9]\n    },\n    ...\n  ]\n}\n\nCode:\n${code}\n\nRespond ONLY with a JSON object as described above.`;

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
    let structuresJson;
    try {
      structuresJson = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse Gemini response', details: content });
    }
    return res.status(200).json(structuresJson);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 