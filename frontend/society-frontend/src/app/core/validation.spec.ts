import { EMAIL_PATTERN, PHONE_PATTERN, passwordProblem } from './validation';

describe('passwordProblem', () => {
  it('accepts a password with letters and numbers', () => {
    expect(passwordProblem('Pass@1234')).toBe('');
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(passwordProblem('Ab1')).toContain('8 to 72');
  });

  it('rejects a password longer than 72 characters', () => {
    expect(passwordProblem('a1'.repeat(40))).toContain('8 to 72');
  });

  it('requires at least one letter', () => {
    expect(passwordProblem('12345678')).toContain('letter');
  });

  it('requires at least one number', () => {
    expect(passwordProblem('abcdefgh')).toContain('number');
  });
});

describe('PHONE_PATTERN', () => {
  it('accepts normal phone numbers', () => {
    expect(PHONE_PATTERN.test('9876543210')).toBe(true);
    expect(PHONE_PATTERN.test('+91 98765-43210')).toBe(true);
  });

  it('rejects letters and numbers that are too short', () => {
    expect(PHONE_PATTERN.test('abc')).toBe(false);
    expect(PHONE_PATTERN.test('12345')).toBe(false);
  });
});

describe('EMAIL_PATTERN', () => {
  it('accepts a normal email address', () => {
    expect(EMAIL_PATTERN.test('ravi@example.com')).toBe(true);
  });

  it('rejects addresses with no @, no dot, or spaces', () => {
    expect(EMAIL_PATTERN.test('ravi')).toBe(false);
    expect(EMAIL_PATTERN.test('ravi@example')).toBe(false);
    expect(EMAIL_PATTERN.test('ra vi@example.com')).toBe(false);
  });
});