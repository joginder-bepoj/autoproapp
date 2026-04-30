import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppToastService, ToastMessage } from '../../services/app-toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-custom-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      <div *ngFor="let toast of toasts$ | async" 
           [class]="'toast-item ' + toast.type">
        <div class="toast-content">
          <div class="toast-left">
            <span class="toast-icon" [innerHTML]="getIconSvg(toast.type)"></span>
            <span class="toast-message">{{ toast.message }}</span>
          </div>
          <button class="toast-close" (click)="removeToast(toast.id)">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="toast-progress" [style.animationDuration.ms]="toast.duration"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 60px;
      right: 20px;
      left: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    @media (min-width: 576px) {
      .toast-wrapper {
        top: 20px;
        left: auto;
        width: 420px;
      }
    }
    .toast-item {
      pointer-events: auto;
      position: relative;
      background: #ffffff;
      color: #1a1a1a;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #e0e0e0;
    }
    .toast-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .toast-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .toast-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .toast-message {
      font-size: 16px;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .toast-close {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s, background-color 0.2s;
      border-radius: 4px;
    }
    .toast-close:hover {
      color: #1a1a1a;
      background-color: rgba(0,0,0,0.05);
    }
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(0,0,0,0.05);
      width: 100%;
      animation: toastProgress linear forwards;
    }

    /* Type Specific Styles matching the image's "Added to cart" vibe */
    .success { 
      border-color: #57a9d0; /* Match app primary blue */
    }
    .success .toast-icon { 
      color: #57a9d0; 
    }
    
    .danger { border-color: #eb445a; }
    .danger .toast-icon { color: #eb445a; }
    
    .warning { border-color: #ffc409; }
    .warning .toast-icon { color: #ffc409; }
    
    .info, .primary { border-color: #57a9d0; }
    .info .toast-icon, .primary .toast-icon { color: #57a9d0; }

    @keyframes toastSlideDown {
      from { transform: translateY(-40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class CustomToastComponent {
  private toastService = inject(AppToastService);
  toasts$: Observable<ToastMessage[]> = this.toastService.toasts$;

  removeToast(id: number) {
    this.toastService.remove(id);
  }

  getIconSvg(type: string): string {
    switch (type) {
      case 'success': 
        return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      case 'danger': 
        return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      case 'warning': 
        return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      default: 
        return '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }
}
