import { jest } from '@jest/globals';

// Global test setup for @extremexp/core package
// This file runs before all tests in the core package

// Configure Jest globals
global.jest = jest;

// Add any global test utilities or mocks here
// For example, you might want to mock ANTLR-generated parsers in some tests

console.log('Core package test setup completed');
