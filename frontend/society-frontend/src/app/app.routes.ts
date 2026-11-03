import { Routes } from '@angular/router';
import { authGuard, homeGuard, roleGuard } from './core/guards';
import { Login } from './login/login';
import { Shell } from './shell/shell';
import { Notices } from './shared/notices';
import { ResidentHome } from './resident/resident-home';
import { MyVisitors } from './resident/my-visitors';
import { MyComplaints } from './resident/my-complaints';
import { MyBills } from './resident/my-bills';
import { MyFamily } from './resident/my-family';
import { SecurityHome } from './security/security-home';
import { RegisterVisitor } from './security/register-visitor';
import { GateLog } from './security/gate-log';
import { AdminHome } from './admin/admin-home';
import { AdminComplaints } from './admin/admin-complaints';
import { AdminBills } from './admin/admin-bills';
import { AdminFlats } from './admin/admin-flats';
import { AdminPeople } from './admin/admin-people';

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
          { path: 'complaints', component: MyComplaints },
          { path: 'bills', component: MyBills },
          { path: 'family', component: MyFamily },
          { path: 'notices', component: Notices }
        ]
      },
      {
        path: 'security',
        component: SecurityHome,
        canActivate: [roleGuard(['SECURITY'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'register' },
          { path: 'register', component: RegisterVisitor },
          { path: 'log', component: GateLog },
          { path: 'notices', component: Notices }
        ]
      },
      {
        path: 'admin',
        component: AdminHome,
        canActivate: [roleGuard(['ADMIN'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'complaints' },
          { path: 'complaints', component: AdminComplaints },
          { path: 'notices', component: Notices },
          { path: 'bills', component: AdminBills },
          { path: 'flats', component: AdminFlats },
          { path: 'people', component: AdminPeople }
        ]
      },
      { path: 'dashboard', pathMatch: 'full', canActivate: [homeGuard], children: [] },
      { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] }
    ]
  },
  { path: '**', redirectTo: '' }
];