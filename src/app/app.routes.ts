import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { HomePage } from './home/home.page';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    component: HomePage,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent
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
    loadComponent: () => import('./shared/feedback/feedback.component').then((m) => m.FeedbackComponent),
  },
  {
    path: 'product-list/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-list/product-list.component').then((m) => m.ProductListComponent),
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
    path: 'category/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/category/category.component').then((m) => m.CategoryComponent),
  },
  {
    path: 'category',
    canActivate: [authGuard],
    loadComponent: () => import('./components/category/category.component').then((m) => m.CategoryComponent),
  },
  {
    path: ':make/:model/vehicle-details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/vehicle-details/vehicle-details.component').then((m) => m.VehicleDetailsComponent),
  },
  {
    path: 'product-category',
    canActivate: [authGuard],
    loadComponent: () => import('./components/product-category/product-category.component').then((m) => m.ProductCategoryComponent),
  },
  {
    path: 'view/:page/:type',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/content-viewer/content-viewer.component').then((m) => m.ContentViewerComponent),
  },
  {
    path: 'pages/:page',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/dynamic-pages/dynamic-pages.component').then((m) => m.DynamicPagesComponent),
  },
  {
    path: 'nissan-bcm-to-pin-20-digit',
    canActivate: [authGuard],
    loadComponent: () => import('./fragments/nissan-bcm-to-pin/nissan-bcm-to-pin.component').then((m) => m.NissanBcmToPinComponent),
  },
  {
    path: 'nissan-bcm-to-pin',
    canActivate: [authGuard],
    loadComponent: () => import('./fragments/nissan-bcm-to-pin/nissan-bcm-to-pin.component').then((m) => m.NissanBcmToPinComponent),
  }
];
