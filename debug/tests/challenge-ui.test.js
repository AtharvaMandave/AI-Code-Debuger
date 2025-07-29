import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Challenge UI Tests', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch.mockClear();
    
    // Mock localStorage
    global.localStorage.getItem.mockReturnValue('test-user-id');
    global.localStorage.setItem.mockImplementation(() => {});
  });

  describe('Initial Loading State', () => {
    test('should show loading screen initially', () => {
      render(<ChallengePage />);
      
      expect(screen.getByText('Loading Challenge Game...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Challenge Navigation', () => {
    test('should allow mode selection', async () => {
      // Mock successful API responses
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 0
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 0
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _id: 'challenge-id',
            title: 'Test Challenge',
            description: 'Test description',
            starterCode: 'function test() {}',
            mode: 'fix-bug',
            language: 'javascript',
            difficulty: 'easy'
          })
        });

      render(<ChallengePage />);

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading Challenge Game...')).not.toBeInTheDocument();
      });

      // Check that mode selection is available
      expect(screen.getByText('Fix the Bug')).toBeInTheDocument();
      expect(screen.getByText('Output Predictor')).toBeInTheDocument();
      expect(screen.getByText('Refactor Rush')).toBeInTheDocument();
    });

    test('should allow difficulty selection', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 0
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            challenges: {
              'fix-bug': [],
              'output-predictor': [],
              'refactor-rush': []
            },
            currentWeek: 1,
            totalChallenges: 0
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _id: 'challenge-id',
            title: 'Test Challenge',
            description: 'Test description',
            starterCode: 'function test() {}',
            mode: 'fix-bug',
            language: 'javascript',
            difficulty: 'easy'
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Challenge Game...')).not.toBeInTheDocument();
      });

      // Check that difficulty indicators are present
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });
  });

  describe('Challenge Display', () => {
    test('should display challenge information correctly', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'This is a test challenge description',
        starterCode: 'function test() {\n  return true;\n}',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'medium'
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
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      });

      expect(screen.getByText('This is a test challenge description')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Fix the Bug')).toBeInTheDocument();
    });

    test('should display output predictor mode correctly', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Output Challenge',
        description: 'What will be the output?',
        starterCode: 'console.log([1,2,3].map(x => x * 2));',
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
        expect(screen.getByText('Output Challenge')).toBeInTheDocument();
      });

      expect(screen.getByText('Predict Output')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your predicted output here...')).toBeInTheDocument();
    });
  });

  describe('Code Editor Integration', () => {
    test('should allow code editing', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
      expect(codeEditor).toHaveValue('function test() {\n  return true;\n}');

      // Test code editing
      fireEvent.change(codeEditor, {
        target: { value: 'function test() {\n  return false;\n}' }
      });

      expect(codeEditor).toHaveValue('function test() {\n  return false;\n}');
    });
  });

  describe('Challenge Submission', () => {
    test('should handle successful submission', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            correct: true,
            feedback: '🎉 Correct! Well done!',
            detailedFeedback: 'Great job fixing the bug!',
            xp: 25,
            rank: 'Bronze',
            attempts: 1,
            xpEarned: 15
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('🎉 Correct! Well done!')).toBeInTheDocument();
      });

      expect(screen.getByText('+15 XP')).toBeInTheDocument();
    });

    test('should handle failed submission', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            correct: false,
            feedback: '❌ Incorrect. Try again!',
            detailedFeedback: 'The bug was not fixed correctly.',
            xp: 10,
            rank: 'Bronze',
            attempts: 2,
            xpEarned: 0
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('❌ Incorrect. Try again!')).toBeInTheDocument();
      });
    });

    test('should handle output predictor submission', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Output Challenge',
        description: 'What will be the output?',
        starterCode: 'console.log([1,2,3].map(x => x * 2));',
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            correct: true,
            feedback: '🎉 Correct! Your output prediction is right!',
            detailedFeedback: 'Expected: "[2,4,6]"\nYour answer: "[2,4,6]"',
            xp: 15,
            rank: 'Bronze',
            attempts: 1,
            xpEarned: 15
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your predicted output here...')).toBeInTheDocument();
      });

      const outputInput = screen.getByPlaceholderText('Enter your predicted output here...');
      fireEvent.change(outputInput, { target: { value: '[2,4,6]' } });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('🎉 Correct! Your output prediction is right!')).toBeInTheDocument();
      });
    });
  });

  describe('Game Controls', () => {
    test('should handle hint functionality', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        expect(screen.getByText('Hint')).toBeInTheDocument();
      });

      const hintButton = screen.getByText('Hint');
      fireEvent.click(hintButton);

      await waitFor(() => {
        expect(screen.getByText('Hint: Check the comparison operator or logic in the loop.')).toBeInTheDocument();
      });
    });

    test('should handle skip functionality', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });

      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Challenge skipped. No XP awarded.')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Functionality', () => {
    test('should display timer correctly', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        expect(screen.getByText(/3:00/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading challenges/)).toBeInTheDocument();
      });
    });

    test('should handle no challenges found', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          challenges: {
            'fix-bug': [],
            'output-predictor': [],
            'refactor-rush': []
          },
          currentWeek: 1,
          totalChallenges: 0
        })
      });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText(/No challenges found for this week/)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    test('should show detailed feedback when available', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            correct: false,
            feedback: '❌ Incorrect. Try again!',
            detailedFeedback: 'The bug was not fixed correctly. You need to change the comparison operator.',
            xp: 10,
            rank: 'Bronze',
            attempts: 1,
            xpEarned: 0
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('❌ Incorrect. Try again!')).toBeInTheDocument();
        expect(screen.getByText('The bug was not fixed correctly. You need to change the comparison operator.')).toBeInTheDocument();
      });
    });

    test('should track and display user statistics', async () => {
      const mockChallenge = {
        _id: 'challenge-id',
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {\n  return true;\n}',
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            correct: true,
            feedback: '🎉 Correct! Well done!',
            detailedFeedback: 'Great job!',
            xp: 25,
            rank: 'Bronze',
            attempts: 5,
            xpEarned: 15
          })
        });

      render(<ChallengePage />);

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Attempts: 5')).toBeInTheDocument();
      });
    });
  });
}); 