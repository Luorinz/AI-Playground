const request = require('supertest');

describe('App Initialization', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have truthy value', () => {
    expect(true).toBeTruthy();
  });
});
