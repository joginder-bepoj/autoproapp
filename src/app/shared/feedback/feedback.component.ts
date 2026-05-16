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

  constructor() {
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
    if (!this.subject.trim() || !this.message.trim()) { return; }

    this.isSubmitting = true;

    // Simulate API call – replace with real service call
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;
      this.resetFormFields();
    }, 1500);
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
