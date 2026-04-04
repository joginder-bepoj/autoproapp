import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    data: { breadcrumb: 'Home' }
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
    data: { breadcrumb: 'Login' }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent),
    data: { breadcrumb: 'Register' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent),
    data: { breadcrumb: 'My Profile' }
  },
  {
    path: 'change-password',
    loadComponent: () => import('./components/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
    data: { breadcrumb: 'Change Password' }
  },
  {
    path: 'feedback',
    loadComponent: () => import('./components/feedback/feedback.component').then((m) => m.FeedbackComponent),
    data: { breadcrumb: 'Feedback' }
  },
  {
    path: 'product-list',
    loadComponent: () => import('./components/product-list/product-list.component').then((m) => m.ProductListComponent),
    data: { breadcrumb: 'All Products' }
  },
  {
    path: 'product-details/:id',
    loadComponent: () => import('./components/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
    data: { breadcrumb: 'Product Details' }
  }
];
