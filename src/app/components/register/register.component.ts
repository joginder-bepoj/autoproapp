import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonSelect, IonSelectOption, IonToggle, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, arrowBackOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonContent, IonInput, IonButton, IonSelect, IonSelectOption, RouterLink, CommonModule, FormsModule, IonToggle, IonLabel, IonIcon],
})
export class RegisterComponent implements OnInit {
  currentStep: number = 1;
  subscribeNewsletter: boolean = false;
  otherInfo: boolean = false;
  questionList: any;
  options = [
    { label: 'Bing', value: 'bing' },
    { label: 'Flyer', value: 'flyer' },
    { label: 'Friend', value: 'friend' },
    { label: 'Google', value: 'google' },
    { label: 'Yahoo', value: 'yahoo' },
    { label: 'Other', value: 'other' },
  ];

  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  phoneNumber = '';
  referral = '';
  company = '';
  addressFirstLine = '';
  addressSecondLine = '';
  city = '';
  country = 'usa';
  state = '';
  postalCode = '';
  referralOther = '';
  constructor(private router: Router, private apiService: ApiService, private utilService: UtilService) {
    addIcons({ cameraOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.getCustomerQuestion();
  }


  getCustomerQuestion() {
    this.apiService.getCustomerQuestion().subscribe((res) => {
      console.log('Customer Questions Response:', res);
      const target = res && res.data ? res.data : res;
      if (target) {
        const list = [];
        if (Array.isArray(target)) {
          for (const item of target) {
            if (item && item.Question) {
              list.push({
                key: item.ChallengeQuestionID || '',
                challengeQuestionId: item.ChallengeQuestionID || '',
                question: item.Question,
                answer: ''
              });
            }
          }
        } else if (typeof target === 'object') {
          for (const key of Object.keys(target)) {
            const item = target[key];
            if (item && item.Question) {
              list.push({
                key: key,
                challengeQuestionId: item.ChallengeQuestionID || '',
                question: item.Question,
                answer: ''
              });
            }
          }
        }
        this.questionList = list;
        console.log('Parsed questionList:', this.questionList);
      }
    });
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.firstName.trim()) {
        this.utilService.showToast('Please enter your first name.', 'danger');
        return;
      }
      if (!this.lastName.trim()) {
        this.utilService.showToast('Please enter your last name.', 'danger');
        return;
      }
      if (!this.email.trim()) {
        this.utilService.showToast('Please enter your email.', 'danger');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email.trim())) {
        this.utilService.showToast('Please enter a valid email address.', 'danger');
        return;
      }
      if (!this.phoneNumber || !this.phoneNumber.toString().trim()) {
        this.utilService.showToast('Please enter your phone number.', 'danger');
        return;
      }
      if (!this.password) {
        this.utilService.showToast('Please enter your password.', 'danger');
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.utilService.showToast('Passwords do not match.', 'danger');
        return;
      }
    }

    if (this.currentStep === 2) {
      if (!this.company.trim()) {
        this.utilService.showToast('Please enter your company name.', 'danger');
        return;
      }
      if (!this.addressFirstLine.trim()) {
        this.utilService.showToast('Please enter your address.', 'danger');
        return;
      }
      if (!this.city.trim()) {
        this.utilService.showToast('Please enter your city.', 'danger');
        return;
      }
      if (!this.postalCode.trim()) {
        this.utilService.showToast('Please enter your zip/postal code.', 'danger');
        return;
      }
      if (!this.country) {
        this.utilService.showToast('Please select your country.', 'danger');
        return;
      }
      if (!this.state) {
        this.utilService.showToast('Please select your state.', 'danger');
        return;
      }
      if (!this.referral) {
        this.utilService.showToast('Please select how you heard about us.', 'danger');
        return;
      }
      if (this.referral === 'other' && !this.referralOther.trim()) {
        this.utilService.showToast('Please specify how you heard about us.', 'danger');
        return;
      }
    }

    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitForm() {
    if (!this.questionList || this.questionList.length < 2) {
      this.utilService.showToast('Security questions are not loaded yet.', 'danger');
      return;
    }

    const questionFirstItem = this.questionList[0];
    const questionSecondItem = this.questionList[1];

    if (!questionFirstItem?.answer?.trim()) {
      this.utilService.showToast(`Please answer the first question: "${questionFirstItem.question}"`, 'danger');
      return;
    }

    if (!questionSecondItem?.answer?.trim()) {
      this.utilService.showToast(`Please answer the second question: "${questionSecondItem.question}"`, 'danger');
      return;
    }

    const rawFirstAns = questionFirstItem?.answer || '';
    const questionFirstVal = !isNaN(Number(rawFirstAns)) && rawFirstAns.trim() !== ''
      ? Number(rawFirstAns)
      : rawFirstAns;

    const selectedOption = this.options.find(o => o.value === this.referral);
    const referralVal = selectedOption ? selectedOption.label : this.referral;

    let formattedPhone = this.phoneNumber ? this.phoneNumber.toString().trim() : '';
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+1' + formattedPhone;
      } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const signUpData = {
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      firstName: this.firstName,
      lastName: this.lastName,
      company: this.company,
      addressFirstLine: this.addressFirstLine,
      addressSecondLine: this.addressSecondLine,
      city: this.city,
      country: this.country,
      state: this.state,
      postalCode: this.postalCode,
      phoneNumber: formattedPhone,
      referral: referralVal || 'Other',
      subscribe: this.subscribeNewsletter,
      questionFirstID: questionFirstItem?.challengeQuestionId ? parseInt(questionFirstItem.challengeQuestionId, 10) : 0,
      questionFirst: questionFirstVal,
      questionSecond: questionSecondItem?.answer || '',
      referralOther: this.referralOther,
      signUpSource: 'autoProApp'
    };

    console.log('Submitting registration payload:', signUpData);

    this.apiService.createCustomer(signUpData).subscribe({
      next: (res: any) => {
        console.log('Customer creation response:', res);
        const data = res && res.data ? res.data : res;
        if (data && (data.result === 'OK' || data.result === 'SUCCESS')) {
          this.utilService.showToast('Account created successfully!', 'success');
          this.router.navigate(['/login']);
        } else {
          const errMsg = data?.message || data?.error || 'Registration failed. Please try again.';
          this.utilService.showToast(errMsg, 'danger');
        }
      },
      error: (err: any) => {
        console.error('Error creating customer:', err);
        this.utilService.showToast('An unexpected error occurred. Please try again.', 'danger');
      }
    });
  }

  // submitOtherInfo() {
  //   this.otherInfo = !this.otherInfo;
  // }
}
