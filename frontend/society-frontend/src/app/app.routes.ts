import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { authGuard, roleGuard } from './core/guards';
import { Login } from './login/login';
import { Shell } from './shell/shell';
import { ResidentHome } from './resident/resident-home';
import { MyVisitors } from './resident/my-visitors';
import { SecurityHome } from './security/security-home';
import { AdminHome } from './admin/admin-home';
import { MyComplaints } from './resident/my-complaints';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'resident',
        component: ResidentHome,
        canActivate: [roleGuard(['RESIDENT'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'visitors' },
          { path: 'visitors', component: MyVisitors },
          { path: 'complaints', component: MyComplaints }
        ]
      },
      { path: 'security', component: SecurityHome, canActivate: [roleGuard(['SECURITY'])] },
      { path: 'admin', component: AdminHome, canActivate: [roleGuard(['ADMIN'])] },
      {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: () => {
          const role = inject(AuthService).currentUser()?.role;
          return role ? '/' + role.toLowerCase() : '/login';
        }
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];