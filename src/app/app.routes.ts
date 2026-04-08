import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./components/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: 'feedback',
    canActivate: [authGuard],
    loadComponent: () => import('./components/feedback/feedback.component').then((m) => m.FeedbackComponent),
  },
  {
    path: 'product-list',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: ':search/product-details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
  },
  {
    path: 'product-details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./components/shopping-cart/shopping-cart.component').then((m) => m.ShoppingCartComponent),
  },
  {
    path: 'category',
    canActivate: [authGuard],
    loadComponent: () => import('./components/category/category.component').then((m) => m.CategoryComponent),
  },
  {
    path: 'vehicle-details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/vehicle-details/vehicle-details.component').then((m) => m.VehicleDetailsComponent),
  }
];
