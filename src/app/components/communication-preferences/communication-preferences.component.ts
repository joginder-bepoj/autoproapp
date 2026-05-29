import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkOutline,
  mailOutline,
  notificationsOutline,
  saveOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { Subject, take, takeUntil } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

@Component({
  selector: 'app-communication-preferences',
  templateUrl: './communication-preferences.component.html',
  styleUrls: ['./communication-preferences.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonToggle,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class CommunicationPreferencesComponent implements OnInit, OnDestroy {
  subscribe = false;
  originalSubscribe = false;
  isSaving = false;

  readonly breadcrumb = [
    { label: 'Account Settings', url: '/account-settings' },
    { label: 'Communications Preferences', url: null },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkOutline,
      mailOutline,
      notificationsOutline,
      saveOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasChanges(): boolean {
    return this.subscribe !== this.originalSubscribe;
  }

  saveChanges(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.utilService.showToast('Please log in again to save preferences.', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.hasChanges) {
      this.utilService.showToast('No changes to save.', 'primary');
      return;
    }

    this.isSaving = true;
    this.utilService.showLoader();
    this.apiService.updateCustomerInfo({ subscribe: this.subscribe }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const result = (data?.result || data?.Result || '').toString().toLowerCase();

        if (result && result !== 'ok') {
          this.isSaving = false;
          this.utilService.hideLoader();
          this.utilService.showToast(data?.message || 'Failed to save subscription setting.', 'danger');
          return;
        }

        this.originalSubscribe = this.subscribe;
        this.refreshProfile();
        this.isSaving = false;
        this.utilService.hideLoader();
        this.utilService.showToast('Saved subscription setting.', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.utilService.hideLoader();
        this.utilService.showToast('Failed to save subscription setting.', 'danger');
      },
    });
  }

  back(): void {
    this.router.navigate(['/account-settings']);
  }

  private loadPreferences(): void {
    const profile = this.utilService.getUserProfile();
    if (profile) {
      this.applyProfile(profile);
      return;
    }

    this.utilService.showLoader();
    this.apiService.getCustomerProfile().pipe(take(1), takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;
        if (profile) {
          this.utilService.setUserProfile(profile);
          this.applyProfile(profile);
        }
        this.utilService.hideLoader();
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        const message = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(message || 'Unable to load profile.', 'danger');
      },
    });
  }

  private refreshProfile(): void {
    this.apiService.getCustomerProfile().pipe(take(1), takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;
        if (profile) this.utilService.setUserProfile(profile);
      },
    });
  }

  private applyProfile(profile: any): void {
    const enabled = profile?.subscribe === true || profile?.isSubscribe === true;
    this.subscribe = enabled;
    this.originalSubscribe = enabled;
  }

  private getUserId(): string | null {
    const user = this.utilService.getUserProfile();
    return user?.customerID ?? user?.customerId ?? user?.id ?? null;
  }
}
