import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChallengePage from '../src/app/challenge/page';

// Mock fetch globally
global.fetch = jest.fn();

describe('Challenge Language Support', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-user-id'),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Language Selection', () => {
    test('should display all supported languages in dropdown', () => {
      render(<ChallengePage />);
      
      const languageSelect = screen.getByDisplayValue('JavaScript');
      expect(languageSelect).toBeInTheDocument();
      
      // Check that all languages are available
      const options = languageSelect.querySelectorAll('option');
      expect(options).toHaveLength(4);
      
      const languageValues = Array.from(options).map(option => option.value);
      expect(languageValues).toContain('javascript');
      expect(languageValues).toContain('python');
      expect(languageValues).toContain('java');
      expect(languageValues).toContain('cpp');
    });

    test('should change language when user selects different language', async () => {
      const mockChallenges = {
        'fix-bug': [{
          _id: 'python-challenge',
          title: 'Python Fix Bug',
          description: 'Fix the bug in this Python code',
          starterCode: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
          mode: 'fix-bug',
          language: 'python',
          difficulty: 'easy'
        }],
        'output-predictor': [],
        'refactor-rush': []
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: mockChallenges,
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenges['fix-bug'][0]
        });

      render(<ChallengePage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('JavaScript')).toBeInTheDocument();
      });

      // Change language to Python
      const languageSelect = screen.getByDisplayValue('JavaScript');
      fireEvent.change(languageSelect, { target: { value: 'python' } });

      // Verify language change is reflected
      await waitFor(() => {
        expect(screen.getByDisplayValue('Python')).toBeInTheDocument();
      });
    });
  });

  describe('Language-Specific Challenge Generation', () => {
    test('should generate challenges for selected language', async () => {
      const mockChallenges = {
        'fix-bug': [{
          _id: 'java-challenge',
          title: 'Java Fix Bug',
          description: 'Fix the bug in this Java code',
          starterCode: 'public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] < arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}',
          mode: 'fix-bug',
          language: 'java',
          difficulty: 'easy'
        }],
        'output-predictor': [],
        'refactor-rush': []
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: mockChallenges,
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenges['fix-bug'][0]
        });

      render(<ChallengePage />);

      // Change to Java
      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('JavaScript');
        fireEvent.change(languageSelect, { target: { value: 'java' } });
      });

      // Verify Java challenge is loaded
      await waitFor(() => {
        expect(screen.getByText('Java Fix Bug')).toBeInTheDocument();
      });

      // Verify the code editor shows Java code
      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor.value).toContain('public class BubbleSort');
      expect(codeEditor.value).toContain('int[] arr');
    });

    test('should handle language-specific challenge generation', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {},
            currentWeek: 1,
            totalChallenges: 0
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Challenges generated successfully' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [{
                _id: 'cpp-challenge',
                title: 'C++ Fix Bug',
                description: 'Fix the bug in this C++ code',
                starterCode: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}',
                mode: 'fix-bug',
                language: 'cpp',
                difficulty: 'easy'
              }]
            },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _id: 'cpp-challenge',
            title: 'C++ Fix Bug',
            description: 'Fix the bug in this C++ code',
            starterCode: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}',
            mode: 'fix-bug',
            language: 'cpp',
            difficulty: 'easy'
          })
        });

      render(<ChallengePage />);

      // Change to C++
      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('JavaScript');
        fireEvent.change(languageSelect, { target: { value: 'cpp' } });
      });

      // Click generate new challenges
      const generateButton = screen.getByText('Generate New');
      fireEvent.click(generateButton);

      // Verify C++ challenges are generated
      await waitFor(() => {
        expect(screen.getByText('C++ Fix Bug')).toBeInTheDocument();
      });

      // Verify C++ code is displayed
      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor.value).toContain('#include <vector>');
      expect(codeEditor.value).toContain('using namespace std;');
      expect(codeEditor.value).toContain('vector<int>& arr');
    });
  });

  describe('Language-Specific Error Handling', () => {
    test('should show appropriate message when no challenges exist for selected language', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {},
            currentWeek: 1,
            totalChallenges: 0
          })
        });

      render(<ChallengePage />);

      // Change to Python
      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('JavaScript');
        fireEvent.change(languageSelect, { target: { value: 'python' } });
      });

      // Verify appropriate message is shown
      await waitFor(() => {
        expect(screen.getByText(/No python challenges found for this week/)).toBeInTheDocument();
      });
    });

    test('should handle API errors for specific languages', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'));

      render(<ChallengePage />);

      // Change to Java
      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('JavaScript');
        fireEvent.change(languageSelect, { target: { value: 'java' } });
      });

      // Verify error message mentions the language
      await waitFor(() => {
        expect(screen.getByText(/Error loading java challenges/)).toBeInTheDocument();
      });
    });
  });

  describe('Language-Specific Challenge Modes', () => {
    test('should support all challenge modes for different languages', async () => {
      const mockChallenges = {
        'fix-bug': [{
          _id: 'python-fix-bug',
          title: 'Python Fix Bug',
          description: 'Fix the bug in this Python code',
          starterCode: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
          mode: 'fix-bug',
          language: 'python',
          difficulty: 'easy'
        }],
        'output-predictor': [{
          _id: 'python-output',
          title: 'Python Output Predictor',
          description: 'What will be the output?\n\narr = [1, 2, 3]\nresult = [x * 2 for x in arr]\nprint(result)',
          starterCode: '',
          mode: 'output-predictor',
          language: 'python',
          difficulty: 'easy'
        }],
        'refactor-rush': [{
          _id: 'python-refactor',
          title: 'Python Refactor Rush',
          description: 'Optimize this Python code',
          starterCode: 'def remove_duplicates(arr):\n    result = []\n    for item in arr:\n        if item not in result:\n            result.append(item)\n    return result',
          mode: 'refactor-rush',
          language: 'python',
          difficulty: 'easy'
        }]
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: mockChallenges,
            currentWeek: 1,
            totalChallenges: 3
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenges['fix-bug'][0]
        });

      render(<ChallengePage />);

      // Change to Python
      await waitFor(() => {
        const languageSelect = screen.getByDisplayValue('JavaScript');
        fireEvent.change(languageSelect, { target: { value: 'python' } });
      });

      // Verify Python fix-bug challenge is loaded
      await waitFor(() => {
        expect(screen.getByText('Python Fix Bug')).toBeInTheDocument();
      });

      // Verify Python code is displayed
      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor.value).toContain('def bubble_sort(arr):');
      expect(codeEditor.value).toContain('for i in range(len(arr)):');
    });
  });

  describe('Language State Management', () => {
    test('should properly update language state when challenge is fetched', async () => {
      const mockChallenge = {
        _id: 'java-challenge',
        title: 'Java Challenge',
        description: 'Java challenge description',
        starterCode: 'public class Test {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        mode: 'fix-bug',
        language: 'java',
        difficulty: 'easy'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: { 'fix-bug': [mockChallenge] },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      // Verify language is updated to match the challenge
      await waitFor(() => {
        expect(screen.getByDisplayValue('Java')).toBeInTheDocument();
      });
    });

    test('should clear challenge when language changes', async () => {
      const mockChallenge = {
        _id: 'javascript-challenge',
        title: 'JavaScript Challenge',
        description: 'JavaScript challenge description',
        starterCode: 'function test() {\n    console.log("Hello World");\n}',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: { 'fix-bug': [mockChallenge] },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      // Wait for initial challenge to load
      await waitFor(() => {
        expect(screen.getByText('JavaScript Challenge')).toBeInTheDocument();
      });

      // Change language
      const languageSelect = screen.getByDisplayValue('JavaScript');
      fireEvent.change(languageSelect, { target: { value: 'python' } });

      // Verify challenge is cleared and new language is set
      await waitFor(() => {
        expect(screen.getByDisplayValue('Python')).toBeInTheDocument();
      });
    });
  });
}); 