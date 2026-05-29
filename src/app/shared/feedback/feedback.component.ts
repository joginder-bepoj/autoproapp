import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonInput, IonTextarea, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  createOutline,
  documentTextOutline,
  cloudUploadOutline,
  closeCircleOutline,
  sendOutline,
  refreshOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  star,
  starOutline,
  bugOutline,
  bulbOutline,
  helpCircleOutline,
  thumbsUpOutline,
  documentOutline,
  imageOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';

export interface FeedbackCategory {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon, IonInput, IonTextarea, FooterComponent],
})
export class FeedbackComponent implements OnInit {

  subject = '';
  message = '';
  selectedCategory = '';
  rating = 0;
  hoverRating = 0;
  attachments: File[] = [];
  isDragOver = false;
  isSubmitting = false;
  isSubmitted = false;

  readonly ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  readonly categories: FeedbackCategory[] = [
    { label: 'Bug Report', value: 'bug', icon: 'bug-outline' },
    { label: 'Suggestion', value: 'suggestion', icon: 'bulb-outline' },
    { label: 'General', value: 'general', icon: 'help-circle-outline' },
    { label: 'Compliment', value: 'compliment', icon: 'thumbs-up-outline' },
  ];

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({
      chatbubbleEllipsesOutline,
      createOutline,
      documentTextOutline,
      cloudUploadOutline,
      closeCircleOutline,
      sendOutline,
      refreshOutline,
      checkmarkCircleOutline,
      hourglassOutline,
      star,
      starOutline,
      bugOutline,
      bulbOutline,
      helpCircleOutline,
      thumbsUpOutline,
      documentOutline,
      imageOutline,
    });
  }

  ngOnInit() { }

  selectCategory(value: string) {
    this.selectedCategory = this.selectedCategory === value ? '' : value;
  }

  setRating(value: number) {
    this.rating = value;
  }

  /* ── Drag & Drop ── */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = '';
    }
  }

  private addFiles(fileList: FileList) {
    const maxFiles = 3;
    const maxSize = 10 * 1024 * 1024; // 10 MB

    Array.from(fileList).forEach((file) => {
      if (this.attachments.length >= maxFiles) { return; }
      if (file.size > maxSize) { return; }
      const alreadyAdded = this.attachments.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!alreadyAdded) {
        this.attachments.push(file);
      }
    });
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) { return 'image-outline'; }
    if (file.type === 'application/pdf') { return 'document-outline'; }
    return 'document-outline';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* ── Submit ── */
  submitFeedback() {
    if (!this.message.trim()) {
      this.utilService.showToast('Feedback is required.', 'danger');
      return;
    }

    this.isSubmitting = true;
    this.utilService.showLoader();

    this.ensureProfile()
      .pipe(
        switchMap((profile: any) => {
          if (!profile) throw new Error('Please log in again to send feedback.');

          const userId = this.getUserId(profile);
          const uploads$ = this.attachments.length
            ? forkJoin(this.attachments.map((file) => this.apiService.uploadFeedbackAttachment(userId, file)))
            : of([]);

          return uploads$.pipe(
            switchMap((downloadURLs) => {
              const feedbackData: Record<string, any> = {
                subject: this.subject.trim(),
                feedback: this.message.trim(),
                email: profile.email || profile.emailId || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                userid: userId,
                time: this.formatFeedbackTime(new Date()),
              };

              if (this.selectedCategory) feedbackData['category'] = this.selectedCategory;
              if (this.rating) feedbackData['rating'] = this.rating;
              if (downloadURLs.length) feedbackData['attachments'] = downloadURLs;

              return this.apiService.sendFeedbackToFirebase(feedbackData).pipe(
                switchMap((feedbackKey) => {
                  if (!feedbackKey) return of(feedbackKey);
                  return this.apiService
                    .addContribution(userId, 'feedbacks', feedbackKey)
                    .pipe(switchMap(() => of(feedbackKey)));
                })
              );
            })
          );
        }),
        take(1)
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isSubmitted = true;
          this.utilService.hideLoader();
          this.utilService.showToast('Feedback sent successfully.', 'success');
          this.resetFormFields();
          this.router.navigate(['/account-settings']);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.utilService.hideLoader();
          const message = err?.message || this.utilService.parseErrorMessage(err);
          this.utilService.showToast(message || 'Failed to send feedback.', 'danger');
        },
      });
  }

  private ensureProfile() {
    const profile = this.utilService.getUserProfile();
    if (profile) return of(profile);

    return this.apiService.getCustomerProfile().pipe(
      switchMap((res: any) => {
        const loadedProfile = res?.data ?? res;
        if (loadedProfile) this.utilService.setUserProfile(loadedProfile);
        return of(loadedProfile);
      })
    );
  }

  private getUserId(profile: any): string {
    return String(profile?.customerID ?? profile?.customerId ?? profile?.id ?? '');
  }

  private formatFeedbackTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  resetForm() {
    this.isSubmitted = false;
    this.resetFormFields();
  }

  private resetFormFields() {
    this.subject = '';
    this.message = '';
    this.selectedCategory = '';
    this.rating = 0;
    this.hoverRating = 0;
    this.attachments = [];
    this.isDragOver = false;
  }
}
