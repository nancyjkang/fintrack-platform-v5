// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js server APIs for testing
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock fetch for Node.js environment
global.fetch = jest.fn()

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/fintrack_test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-testing-only'
