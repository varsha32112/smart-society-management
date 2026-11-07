import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('shows the message sent by the server', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Email already registered' } });
    expect(errorMessage(error)).toBe('Email already registered');
  });

  it('explains when the server cannot be reached', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(errorMessage(error)).toContain('Cannot reach the server');
  });

  it('falls back to a general message', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'boom' });
    expect(errorMessage(error)).toContain('Something went wrong');
  });
});