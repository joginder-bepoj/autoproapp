import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonIcon, IonInput, IonContent, IonButton } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  callOutline,
  saveOutline,
  lockClosedOutline,
  keyOutline,
  eyeOutline,
  lockOpenOutline,
  eyeOffOutline,
  shieldCheckmarkOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonInput, IonButton, FooterComponent]
})
export class ChangePasswordComponent implements OnInit {

  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';

  newPassword = '';
  confirmPassword = '';

  showNew = false;
  showConfirm = false;

  private originalEmail = '';

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({
      personOutline,
      mailOutline,
      callOutline,
      saveOutline,
      lockClosedOutline,
      keyOutline,
      eyeOutline,
      lockOpenOutline,
      eyeOffOutline,
      shieldCheckmarkOutline,
      closeOutline,
      checkmarkOutline
    });
  }

  ngOnInit() {
    const user = this.utilService.getUserProfile();
    if (user) {
      this.firstName = user.firstName || '';
      this.lastName = user.lastName || '';
      this.email = user.email || user.emailId || '';
      this.phoneNumber = user.phoneNumber || '';
      this.originalEmail = this.email || '';
    } else {
      this.utilService.showLoader();
      this.apiService.getCustomerProfile().subscribe({
        next: (res: any) => {
          const profile = res?.data ?? res;
          if (profile) {
            this.utilService.setUserProfile(profile);
            this.firstName = profile.firstName || '';
            this.lastName = profile.lastName || '';
            this.email = profile.email || profile.emailId || '';
            this.phoneNumber = profile.phoneNumber || '';
            this.originalEmail = this.email || '';
          }
          this.utilService.hideLoader();
        },
        error: () => {
          this.utilService.hideLoader();
        }
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private normalizePhone(phone: string): string {
    const digits = (phone || '').toString().replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
    if (phone.trim().startsWith('+')) return phone.trim();
    return digits;
  }

  submit() {
    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    const email = this.email.trim();
    const phoneRaw = this.phoneNumber.toString().trim();
    const phoneDigits = phoneRaw.replace(/\D/g, '');

    if (!firstName) {
      this.utilService.showToast('First name is required.', 'danger');
      return;
    }
    if (!lastName) {
      this.utilService.showToast('Last name is required.', 'danger');
      return;
    }
    if (!this.isValidEmail(email)) {
      this.utilService.showToast('Invalid email address.', 'danger');
      return;
    }
    if (phoneDigits.length < 10) {
      this.utilService.showToast('Enter a correct phone number.', 'danger');
      return;
    }

    const newpwd = this.newPassword;
    const confirm = this.confirmPassword;

    const anyPwdFilled = !!(newpwd || confirm);
    if (anyPwdFilled) {
      if (!newpwd) {
        this.utilService.showToast('New password is required.', 'danger');
        return;
      }
      if (!confirm) {
        this.utilService.showToast('Confirm password is required.', 'danger');
        return;
      }
      if (newpwd !== confirm) {
        this.utilService.showToast('Password does not match.', 'danger');
        return;
      }
    }

    const payload: any = {
      phoneNumber: this.normalizePhone(phoneRaw),
      firstName,
      lastName,
      emailUpdate: email,
    };

    if (anyPwdFilled) {
      payload.password = newpwd;
    }

    this.utilService.showLoader();
    this.apiService.updateCustomerInfo(payload).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();

        const data = res?.data ?? res;
        const ok = (data?.result || data?.Result || '').toString().toLowerCase() === 'ok';
        if (!ok) {
          this.utilService.showToast(data?.message || 'Try again.', 'danger');
          return;
        }

        const emailChanged = this.originalEmail && email && this.originalEmail.toLowerCase() !== email.toLowerCase();
        const passwordChanged = anyPwdFilled;

        if (emailChanged || passwordChanged) {
          this.utilService.showToast('Updated. Please log in again.', 'success');
          this.utilService.logout();
          return;
        }

        this.utilService.showToast('Updated successfully.', 'success');
        this.apiService.getCustomerProfile().subscribe({
          next: (profileRes: any) => {
            const profile = profileRes?.data ?? profileRes;
            if (profile) this.utilService.setUserProfile(profile);
          }
        });
        this.router.navigate(['/profile']);
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        console.error('Update customer info error:', err);
        this.utilService.showToast('Try again.', 'danger');
      }
    });
  }

  cancel() {
    this.router.navigate(['/profile']);
  }

}
