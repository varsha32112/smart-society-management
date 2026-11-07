import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

const reply = {
  token: 'abc.def.ghi',
  user: { id: 1, fullName: 'Ravi Kumar', email: 'ravi@example.com', role: 'RESIDENT', flatId: 1 }
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }])
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('saves the token and the user after a successful login', () => {
    service.login('ravi@example.com', 'Pass@123').subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush(reply);

    expect(service.token).toBe('abc.def.ghi');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.currentUser()?.fullName).toBe('Ravi Kumar');
  });

  it('forgets everything on logout', () => {
    service.login('ravi@example.com', 'Pass@123').subscribe();
    http.expectOne('/api/auth/login').flush(reply);

    service.logout();

    expect(service.token).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});