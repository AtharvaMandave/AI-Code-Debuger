import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  const challenges = [
    // JavaScript Challenges
    {
      title: 'Fix the Bug in Bubble Sort',
      description: 'The following bubble sort implementation has a bug. Fix it so it sorts the array correctly.',
      starterCode: `function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] < arr[j + 1]) { // BUG: should be >\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}`,
      solution: `function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}`,
      mode: 'fix-bug',
      tags: ['easy', 'javascript', 'sorting'],
      language: 'javascript',
      difficulty: 'easy',
    },
    {
      title: 'Predict Output: Array Map',
      description: 'What is the output of the following code?',
      starterCode: `const arr = [1,2,3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);`,
      solution: '[2,4,6]',
      mode: 'output-predictor',
      tags: ['easy', 'javascript', 'array'],
      language: 'javascript',
      difficulty: 'easy',
    },
    {
      title: 'Refactor Rush: Remove Duplicates',
      description: 'Refactor this code to improve its efficiency.',
      starterCode: `function removeDuplicates(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}`,
      solution: `function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}`,
      mode: 'refactor-rush',
      tags: ['medium', 'javascript', 'array'],
      language: 'javascript',
      difficulty: 'medium',
    },
    
    // Python Challenges
    {
      title: 'Fix the Bug in Bubble Sort',
      description: 'The following bubble sort implementation has a bug. Fix it so it sorts the array correctly.',
      starterCode: `def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:  # BUG: should be >\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr`,
      solution: `def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr`,
      mode: 'fix-bug',
      tags: ['easy', 'python', 'sorting'],
      language: 'python',
      difficulty: 'easy',
    },
    {
      title: 'Predict Output: List Comprehension',
      description: 'What is the output of the following code?',
      starterCode: `arr = [1, 2, 3]\nresult = [x * 2 for x in arr]\nprint(result)`,
      solution: '[2, 4, 6]',
      mode: 'output-predictor',
      tags: ['easy', 'python', 'list'],
      language: 'python',
      difficulty: 'easy',
    },
    {
      title: 'Refactor Rush: Remove Duplicates',
      description: 'Refactor this code to improve its efficiency.',
      starterCode: `def remove_duplicates(arr):\n    result = []\n    for item in arr:\n        if item not in result:\n            result.append(item)\n    return result`,
      solution: `def remove_duplicates(arr):\n    return list(set(arr))`,
      mode: 'refactor-rush',
      tags: ['medium', 'python', 'list'],
      language: 'python',
      difficulty: 'medium',
    },
    
    // Java Challenges
    {
      title: 'Fix the Bug in Bubble Sort',
      description: 'The following bubble sort implementation has a bug. Fix it so it sorts the array correctly.',
      starterCode: `public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] < arr[j + 1]) { // BUG: should be >\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}`,
      solution: `public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] > arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}`,
      mode: 'fix-bug',
      tags: ['easy', 'java', 'sorting'],
      language: 'java',
      difficulty: 'easy',
    },
    {
      title: 'Predict Output: Array Stream',
      description: 'What is the output of the following code?',
      starterCode: `import java.util.Arrays;\nimport java.util.stream.IntStream;\n\nint[] arr = {1, 2, 3};\nint[] result = Arrays.stream(arr).map(x -> x * 2).toArray();\nSystem.out.println(Arrays.toString(result));`,
      solution: '[2, 4, 6]',
      mode: 'output-predictor',
      tags: ['easy', 'java', 'array'],
      language: 'java',
      difficulty: 'easy',
    },
    {
      title: 'Refactor Rush: Remove Duplicates',
      description: 'Refactor this code to improve its efficiency.',
      starterCode: `import java.util.*;\n\npublic static List<Integer> removeDuplicates(List<Integer> arr) {\n    List<Integer> result = new ArrayList<>();\n    for (Integer item : arr) {\n        if (!result.contains(item)) {\n            result.add(item);\n        }\n    }\n    return result;\n}`,
      solution: `import java.util.*;\n\npublic static List<Integer> removeDuplicates(List<Integer> arr) {\n    return new ArrayList<>(new LinkedHashSet<>(arr));\n}`,
      mode: 'refactor-rush',
      tags: ['medium', 'java', 'list'],
      language: 'java',
      difficulty: 'medium',
    },
    
    // C++ Challenges
    {
      title: 'Fix the Bug in Bubble Sort',
      description: 'The following bubble sort implementation has a bug. Fix it so it sorts the array correctly.',
      starterCode: `#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) { // BUG: should be >\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}`,
      solution: `#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}`,
      mode: 'fix-bug',
      tags: ['easy', 'cpp', 'sorting'],
      language: 'cpp',
      difficulty: 'easy',
    },
    {
      title: 'Predict Output: Vector Transform',
      description: 'What is the output of the following code?',
      starterCode: `#include <vector>\n#include <algorithm>\n#include <iostream>\nusing namespace std;\n\nvector<int> arr = {1, 2, 3};\nvector<int> result;\nfor (int x : arr) {\n    result.push_back(x * 2);\n}\nfor (int x : result) {\n    cout << x << " ";\n}`,
      solution: '2 4 6',
      mode: 'output-predictor',
      tags: ['easy', 'cpp', 'vector'],
      language: 'cpp',
      difficulty: 'easy',
    },
    {
      title: 'Refactor Rush: Remove Duplicates',
      description: 'Refactor this code to improve its efficiency.',
      starterCode: `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nvector<int> removeDuplicates(vector<int>& arr) {\n    vector<int> result;\n    for (int item : arr) {\n        if (find(result.begin(), result.end(), item) == result.end()) {\n            result.push_back(item);\n        }\n    }\n    return result;\n}`,
      solution: `#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nvector<int> removeDuplicates(vector<int>& arr) {\n    unordered_set<int> seen;\n    vector<int> result;\n    for (int item : arr) {\n        if (seen.insert(item).second) {\n            result.push_back(item);\n        }\n    }\n    return result;\n}`,
      mode: 'refactor-rush',
      tags: ['medium', 'cpp', 'vector'],
      language: 'cpp',
      difficulty: 'medium',
    }
  ];
  try {
    await Challenge.deleteMany({});
    await Challenge.insertMany(challenges);
    return res.status(200).json({ message: 'Challenges seeded!' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
} 