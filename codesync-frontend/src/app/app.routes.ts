import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { EditorComponent } from './components/editor/editor';
import { AuthGuard } from './guards/auth.guard';
import { OAuth2CallbackComponent } from './components/oauth2-callback/oauth2-callback';

import { LandingComponent } from './components/landing/landing';

import { AdminComponent } from './components/admin/admin';
import { AdminGuard } from './guards/admin.guard';
import { ProfileComponent } from './components/profile/profile';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'oauth2/callback', component: OAuth2CallbackComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'editor/:projectId', component: EditorComponent },
  { path: '**', redirectTo: '' }
];
