import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/dynamic', () => () => {
  const MockCodeEditor = ({ value, onChange, readOnly }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
    />
  );
  return MockCodeEditor;
});

// Mock the challenge page component
const ChallengePage = require('../src/app/challenge/page').default;

describe('Challenge Code Provisioning Tests', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.localStorage.getItem.mockReturnValue('test-user-id');
  });

  describe('Fix Bug Mode', () => {
    test('should provide buggy code in editor for fix-bug mode', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Fix the Bug',
        description: 'Fix the bug in this bubble sort implementation',
        starterCode: 'function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] < arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [mockChallenge],
              'output-predictor': [],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      });

      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor).toHaveValue(mockChallenge.starterCode);
      expect(screen.getByText('Fix the Bug')).toBeInTheDocument();
      expect(screen.getByText('The code below has a bug. Identify and fix it.')).toBeInTheDocument();
      
      // Verify the bug is subtle (no obvious comments)
      expect(codeEditor.value).not.toContain('BUG:');
      expect(codeEditor.value).not.toContain('FIX:');
      expect(codeEditor.value).not.toContain('// BUG');
    });
  });

  describe('Output Predictor Mode', () => {
    test('should not provide code in editor for output-predictor mode', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Predict Output',
        description: 'What will be the output of the following code?\n\nconst arr = [1, 2, 3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);',
        starterCode: '', // Should be empty for output-predictor
        mode: 'output-predictor',
        language: 'javascript',
        difficulty: 'easy'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [mockChallenge],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('Predict Output')).toBeInTheDocument();
      });

      // Should not have code editor for output-predictor mode
      expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument();
      
      // Should have output prediction textarea
      expect(screen.getByPlaceholderText(/Enter your predicted output here/)).toBeInTheDocument();
      expect(screen.getByText('Analyze the code shown in the description and predict what output it will produce.')).toBeInTheDocument();
    });

    test('should display code in description for output-predictor mode', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Predict Output',
        description: 'What will be the output of the following code?\n\nconst arr = [1, 2, 3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);',
        starterCode: '',
        mode: 'output-predictor',
        language: 'javascript',
        difficulty: 'easy'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [mockChallenge],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('What will be the output of the following code?')).toBeInTheDocument();
      });

      // Should display the code in the description
      expect(screen.getByText('const arr = [1, 2, 3];')).toBeInTheDocument();
      expect(screen.getByText('const result = arr.map(x => x * 2);')).toBeInTheDocument();
      expect(screen.getByText('console.log(result);')).toBeInTheDocument();
    });
  });

  describe('Refactor Rush Mode', () => {
    test('should provide inefficient code in editor for refactor-rush mode', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Optimize Code',
        description: 'Optimize this inefficient code for better performance',
        starterCode: 'function removeDuplicates(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}',
        mode: 'refactor-rush',
        language: 'javascript',
        difficulty: 'medium'
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [],
              'refactor-rush': [mockChallenge]
            },
            currentWeek: 1,
            totalChallenges: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChallenge
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      });

      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor).toHaveValue(mockChallenge.starterCode);
      expect(screen.getByText('Optimize the Code')).toBeInTheDocument();
      expect(screen.getByText('The code below is inefficient. Optimize it for better performance.')).toBeInTheDocument();
      
      // Verify the code is realistic (no obvious comments)
      expect(codeEditor.value).not.toContain('INEFFICIENT:');
      expect(codeEditor.value).not.toContain('OPTIMIZE:');
      expect(codeEditor.value).not.toContain('// SLOW');
    });
  });

  describe('Challenge Navigation', () => {
    test('should properly initialize code when navigating between challenges', async () => {
      const mockChallenges = {
        'fix-bug': [{
          _id: 'fix-bug-challenge',
          title: 'Fix Bug Challenge',
          description: 'Fix the bug',
          starterCode: 'function test() { return false; }',
          mode: 'fix-bug',
          language: 'javascript',
          difficulty: 'easy'
        }],
        'output-predictor': [{
          _id: 'output-challenge',
          title: 'Output Challenge',
          description: 'What will be the output?\n\nconsole.log([1,2,3]);',
          starterCode: '',
          mode: 'output-predictor',
          language: 'javascript',
          difficulty: 'easy'
        }],
        'refactor-rush': [{
          _id: 'refactor-challenge',
          title: 'Refactor Challenge',
          description: 'Optimize this code',
          starterCode: 'function slow() { /* inefficient code */ }',
          mode: 'refactor-rush',
          language: 'javascript',
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

      await waitFor(() => {
        expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      });

      // Initially should have fix-bug code
      const codeEditor = screen.getByTestId('code-editor');
      expect(codeEditor).toHaveValue('function test() { return false; }');

      // Simulate navigation to output-predictor (this would be done by user interaction)
      // The actual navigation logic would need to be tested with user events
    });
  });

  describe('UI Text and Instructions', () => {
    test('should show appropriate instructions for each mode', async () => {
      const testCases = [
        {
          mode: 'fix-bug',
          title: 'Fix Bug Challenge',
          expectedTitle: 'Fix the Bug',
          expectedInstruction: 'The code below has a bug. Identify and fix it.'
        },
        {
          mode: 'output-predictor',
          title: 'Output Challenge',
          expectedTitle: 'Predict Output',
          expectedInstruction: 'Analyze the code shown in the description and predict what output it will produce.'
        },
        {
          mode: 'refactor-rush',
          title: 'Refactor Challenge',
          expectedTitle: 'Optimize the Code',
          expectedInstruction: 'The code below is inefficient. Optimize it for better performance.'
        }
      ];

      for (const testCase of testCases) {
        const mockChallenge = {
          _id: `challenge-${testCase.mode}`,
          title: testCase.title,
          description: 'Test description',
          starterCode: 'function test() {}',
          mode: testCase.mode,
          language: 'javascript',
          difficulty: 'easy'
        };

        global.fetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              challenges: {
                [testCase.mode]: [mockChallenge]
              },
              currentWeek: 1,
              totalChallenges: 1
            })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockChallenge
          });

        const { unmount } = render(<ChallengePage />);

        await waitFor(() => {
          expect(screen.getByText(testCase.expectedTitle)).toBeInTheDocument();
        });

        expect(screen.getByText(testCase.expectedInstruction)).toBeInTheDocument();

        unmount();
      }
    });
  });
}); 