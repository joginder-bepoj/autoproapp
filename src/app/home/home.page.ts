import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonIcon,
  IonContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilService } from '../services/util.service';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  searchOutline,
  chevronForwardOutline,
  speedometerOutline,
  keyOutline,
  bookOutline,
  constructOutline,
  documentTextOutline,
  peopleOutline,
  carOutline,
  notificationsOutline,
  personCircleOutline,
  barcodeOutline, carSportOutline, arrowForwardOutline, chevronDownOutline, timeOutline
} from 'ionicons/icons';




@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonIcon,
    IonContent,
    FooterComponent
  ],
})
export class HomePage {
  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;

  modelSearchQuery: string = '';
  vehicleSearchQuery: string = '';
  vinSearchQuery: string = '';
  isVinScannerOpen: boolean = false;
  scannerError: string = '';

  private scannerStream: MediaStream | null = null;
  private scannerFrameId: number | null = null;
  private barcodeDetector: any = null;
  private scannerReadErrorShown: boolean = false;
  scannerMode: 'vin' | 'product' = 'vin';

  tools = [
    { title: 'KEY CODES\nPIN CODES', icon: 'speedometer-outline', url: '/pin-codes' },
    { title: 'KEY BLANK\nCROSS-REF', icon: 'key-outline', url: '/key-blank-cross-ref' },
    { title: 'LOCKSMITH\nREFERENCES', icon: 'book-outline', url: '/locksmith-references' },
    { title: 'TOOLS &\nREFERENCES', icon: 'construct-outline', url: '/tool-references' },
    { title: 'ARTICLES\n& TUTORIALS', icon: 'document-text-outline', url: '/Articles-Tutorials' },
    // { title: 'SEARCH\nHISTORY', icon: 'time-outline', url: '/search-history' },
    { title: 'PROFESSIONAL\nTALK', icon: 'people-outline' },
  ];

  popularSearches = [
    { label: 'Keys Cut', image: 'assets/images/key-fob.png' },
    { label: 'Tools Used', image: 'assets/images/machine.png' },
    { label: 'Latest Gear', image: 'assets/images/logo.png' },
  ];

  constructor(private router: Router, private utilService: UtilService) {
    addIcons({ searchOutline, carSportOutline, chevronForwardOutline, carOutline, keyOutline, barcodeOutline, cameraOutline, speedometerOutline, bookOutline, constructOutline, documentTextOutline, peopleOutline, notificationsOutline, personCircleOutline, arrowForwardOutline, chevronDownOutline, timeOutline });
  }

  ngOnDestroy() {
    this.closeVinScanner();
  }

  onModelSearch() {
    if (this.modelSearchQuery.trim()) {
      this.router.navigate(['/product-list'], { queryParams: { q: this.modelSearchQuery } });
    }
  }

  onVehicleSearch() {
    if (this.vehicleSearchQuery.trim()) {
      this.router.navigate(['/category'], { queryParams: { search: this.vehicleSearchQuery.toLocaleLowerCase() } });
    }
  }

  onVinSearch() {
    const vin = this.normalizeVin(this.vinSearchQuery);

    if (!vin) {
      this.showScannerToast('Enter or scan a VIN first.', 'warning');
      return;
    }

    // if (!this.isValidVin(vin)) {
    //   this.scannerError = 'VIN must be 17 characters and cannot contain I, O, or Q.';
    //   return;
    // }

    this.scannerError = '';
    this.scannerReadErrorShown = false;
    this.router.navigate(['/product-list'], { queryParams: { q: vin } });
  }

  async openVinScanner() {
    this.scannerMode = 'vin';
    await this.openBarcodeScanner();
  }

  async openProductScanner() {
    this.scannerMode = 'product';
    await this.openBarcodeScanner();
  }

  async openBarcodeScanner() {
    this.scannerError = '';

    if (!('BarcodeDetector' in window)) {
      this.showScannerToast('Camera barcode scanning is not supported on this device/browser.', 'warning');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.showScannerToast('Camera access is not available on this device/browser.', 'warning');
      return;
    }

    try {
      this.barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['code_39', 'code_128', 'qr_code', 'ean_13'],
      });

      this.scannerStream = await this.requestCameraStream();
      this.isVinScannerOpen = true;

      setTimeout(() => {
        const video = this.scannerVideo?.nativeElement;
        if (!video || !this.scannerStream) return;

        video.srcObject = this.scannerStream;
        video.play();
        this.scanBarcodeFrame();
      });
    } catch (error) {
      this.showScannerToast(this.getCameraErrorMessage(error), 'warning', 4500);
      this.closeVinScanner(false);
    }
  }

  private async requestCameraStream(): Promise<MediaStream> {
    const permissions = (navigator as any).permissions;

    if (permissions?.query) {
      try {
        const status = await permissions.query({ name: 'camera' as PermissionName });

        if (status.state === 'denied') {
          throw new Error('camera-permission-denied');
        }
      } catch (error: any) {
        if (error?.message === 'camera-permission-denied') {
          throw error;
        }
      }
    }

    this.showScannerToast('Allow camera permission to start scanning.', 'primary', 2200);

    const stream = await this.getBestRearCameraStream();
    await this.applyCameraFocus(stream);
    return stream;
  }

  private async getBestRearCameraStream(): Promise<MediaStream> {
    const highQualityRearCamera: MediaStreamConstraints = {
      video: {
        facingMode: { exact: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    };

    try {
      return await navigator.mediaDevices.getUserMedia(highQualityRearCamera);
    } catch {
      return navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
    }
  }

  private async applyCameraFocus(stream: MediaStream): Promise<void> {
    const track = stream.getVideoTracks()[0];
    const capabilities = (track as any)?.getCapabilities?.() || {};
    const constraints: any = { advanced: [] };

    if (capabilities.focusMode?.includes('continuous')) {
      constraints.advanced.push({ focusMode: 'continuous' });
    }

    if (capabilities.exposureMode?.includes('continuous')) {
      constraints.advanced.push({ exposureMode: 'continuous' });
    }

    if (capabilities.whiteBalanceMode?.includes('continuous')) {
      constraints.advanced.push({ whiteBalanceMode: 'continuous' });
    }

    if (!constraints.advanced.length) return;

    try {
      await track.applyConstraints(constraints);
    } catch {
      // Some WebViews report capabilities they cannot actually apply.
    }
  }

  private getCameraErrorMessage(error: any): string {
    const name = error?.name || '';
    const message = error?.message || '';

    if (name === 'NotAllowedError' || message === 'camera-permission-denied') {
      return 'Camera permission is required to scan. Please allow camera access in app settings and try again.';
    }

    if (name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }

    return 'Camera is unavailable right now. Please try again or enter the value manually.';
  }

  closeVinScanner(clearError: boolean = true) {
    if (this.scannerFrameId) {
      cancelAnimationFrame(this.scannerFrameId);
      this.scannerFrameId = null;
    }

    this.scannerStream?.getTracks().forEach(track => track.stop());
    this.scannerStream = null;
    this.barcodeDetector = null;
    this.isVinScannerOpen = false;

    if (clearError) {
      this.scannerError = '';
    }
  }

  private async scanBarcodeFrame() {
    const video = this.scannerVideo?.nativeElement;

    if (!video || !this.barcodeDetector || !this.isVinScannerOpen) return;

    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const barcodes = await this.barcodeDetector.detect(video);
        const rawValue = barcodes
          .map((barcode: any) => barcode.rawValue || '')
          .find((value: string) => !!value);

        if (rawValue) {
          if (this.scannerMode === 'vin') {
            const vin = this.extractVin(rawValue);
            if (!vin) {
              this.scannerFrameId = requestAnimationFrame(() => this.scanBarcodeFrame());
              return;
            }

            this.vinSearchQuery = vin;
            this.closeVinScanner();
            this.onVinSearch();
            return;
          }

          const searchText = this.extractProductSearchText(rawValue);
          this.modelSearchQuery = searchText;
          this.closeVinScanner();
          this.router.navigate(['/product-list'], { queryParams: { q: searchText } });
          return;
        }
      }
    } catch {
      if (!this.scannerReadErrorShown) {
        this.scannerReadErrorShown = true;
        this.showScannerToast(
          this.scannerMode === 'vin'
            ? 'Could not read the barcode. Try again or enter the VIN manually.'
            : 'Could not read the barcode. Try again or enter the product code manually.',
          'warning'
        );
      }
    }

    this.scannerFrameId = requestAnimationFrame(() => this.scanBarcodeFrame());
  }

  private normalizeVin(value: string): string {
    return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  private extractVin(value: string): string {
    const cleaned = this.normalizeVin(value);
    const match = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
    return match ? match[0] : '';
  }

  // private isValidVin(value: string): boolean {
  //   return /^[A-HJ-NPR-Z0-9]{17}$/.test(value);
  // }

  private extractProductSearchText(value: string): string {
    const trimmed = (value || '').trim();

    try {
      const url = new URL(trimmed);
      return url.pathname.split('/').filter(Boolean).pop() || trimmed;
    } catch {
      return trimmed;
    }
  }

  private showScannerToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary',
    duration: number = 3000
  ) {
    this.utilService.showToast(message, color, duration);
  }

  openCategoryPage() {
    this.router.navigate(['/category']);
  }

  openProductCategoryPage() {
    this.router.navigate(['/product-category']);
  }

  trackByToolTitle(index: number, tool: any): string {
    return tool.title;
  }

  navigateTo(url: string | undefined) {
    if (url) {
      // Direct routes that don't need the /pages prefix
      const directRoutes = ['/search-history', '/key-blank-cross-ref', '/nissan-bcm-to-pin', '/nissan-bcm-to-pin-20-digit'];
      if (directRoutes.some(r => url.startsWith(r))) {
        this.router.navigate([url]);
      } else {
        this.router.navigate(['/pages' + url]);
      }
    }
  }
}
