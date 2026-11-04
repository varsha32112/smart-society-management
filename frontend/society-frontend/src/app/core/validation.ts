export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/;

export function passwordProblem(password: string): string {
  if (password.length < 8 || password.length > 72) {
    return 'Password must be 8 to 72 characters';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return '';
}
