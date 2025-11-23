// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the error emitter to prevent errors from crashing tests
jest.mock('./src/firebase/error-emitter', () => ({
  errorEmitter: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}));
