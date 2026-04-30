import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private toastId = 0;

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' | 'primary' = 'info', duration: number = 3000) {
    const id = this.toastId++;
    const toast: ToastMessage = { id, message, type, duration };
    
    const currentToasts = this.toastsSubject.value;
    const newToasts = [...currentToasts, toast];

    // Limit to max 3 toasts - remove oldest if needed
    if (newToasts.length > 3) {
      newToasts.shift();
    }
    
    this.toastsSubject.next(newToasts);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
