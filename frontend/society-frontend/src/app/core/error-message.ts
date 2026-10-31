import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(err: HttpErrorResponse): string {
  const serverMessage = typeof err.error?.message === 'string' ? err.error.message : '';
  if (serverMessage) {
    return serverMessage;
  }
  if (err.status === 0) {
    return 'Cannot reach the server. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}