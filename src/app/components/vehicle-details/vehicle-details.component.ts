import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/components/breadcrumbs/breadcrumbs.component';
import { IonIcon, IonButton, IonBadge } from "@ionic/angular/standalone";
import { CommonModule, TitleCasePipe, DecimalPipe, DatePipe, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline,
  buildOutline,
  addOutline,
  keyOutline,
  carOutline,
  constructOutline,
  alertCircleOutline,
  shareOutline,
  heartOutline,
  removeOutline,
  cartOutline,
  chevronBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-vehicle-details',
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
    IonBadge,
    BreadcrumbsComponent,
    CommonModule,
    RouterModule,
    TitleCasePipe,
    DecimalPipe,
    DatePipe,
    NgIf
  ]
})
export class VehicleDetailsComponent implements OnInit {

  vehicle: any = null;
  activeTab: string = 'overview';
  activeYear: any = null;
  imgBaseUrl: string = '';
  selectedMake: any = null;
  selectedModel: any = null;
  currentImageIndex: number = 0;

  tumblerRows: any[] = [];
  mechanicalKeys: any[] = [];
  transponderKeys: any[] = [];
  remotes: any[] = [];
  keymakingMethods: any[] = [];
  tipCategories: string[] = [];
  vehicleParts: any[] = [];

  breadcrumb: any[] = [
    // { label: 'Home', url: '/home' },
    { label: 'Vehicle Search', url: '/category' },
    // { label: 'Details', url: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private utilService: UtilService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({
      chevronForwardOutline,
      buildOutline,
      addOutline,
      keyOutline,
      carOutline,
      constructOutline,
      alertCircleOutline,
      shareOutline,
      heartOutline,
      removeOutline,
      cartOutline,
      chevronBackOutline
    });
    this.imgBaseUrl = this.utilService.getImgBaseUrl();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '';
      this.selectedMake = params.get('make') || '';
      this.selectedModel = params.get('model') || '';
      if (id) {
        this.fetchVehicle(id);
      }
    });
  }

  fetchVehicle(id: string) {
    this.utilService.showLoader();
    this.apiService.getVehicleDetail(id).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        if (res) {
          this.vehicle = res;
          this.parseVehicleData();
          console.log(this.vehicle.vehicle_info?.decode_with);
        }
      },
      error: () => {
        this.utilService.hideLoader();
      }
    });
  }

  parseVehicleData() {
    if (!this.vehicle) return;

    // 1. Tumbler Data
    this.tumblerRows = [];
    const td = this.vehicle.tubmler_data;
    if (td) {
      Object.keys(td).forEach(key => {
        const label = key.replace(/^[A-Z]_/, '').replace(/_/g, ' ');
        this.tumblerRows.push({
          label: label,
          values: td[key]
        });
      });
    }

    // 2. Keys
    const keys = this.vehicle.vehicle_info?.the_keys?.key_type;
    this.mechanicalKeys = keys?.Mechanical_Key || [];
    this.transponderKeys = keys?.Transponder_Key || [];

    // 3. Remotes
    this.remotes = [];
    const remotesInput = this.vehicle.vehicle_info?.the_remotes;
    // if (remotesInput) {
    //   Object.keys(remotesInput).forEach(type => {
    //     ?.forEach((item: any) => {
    //       this.remotes.push({ ...item, type: type });
    //     });
    //   });
    // }

    // 5. Methods
    this.keymakingMethods = this.vehicle.key_making_methods?.methods || [];

    // 6. Tips
    const tips = this.vehicle.tips_tricks_methods?.methods || {};
    this.tipCategories = Object.keys(tips);

    // 7. Parts
    this.vehicleParts = this.vehicle.vehicle_parts || [];

    // 8. Year Management
    if (this.vehicle.years && this.vehicle.years.length) {
      const currentId = this.route.snapshot.paramMap.get('id');
      console.log(this.vehicle.years);
      this.activeYear = this.vehicle.years.find((y: any) => y.vehicleID == currentId) || this.vehicle.years[0];
      console.log(this.activeYear);
    }

    // 9. Breadcrumb update
    const name = `${this.selectedMake} ${this.selectedModel} ${this.activeYear?.year || ''}`;
    // this.breadcrumb[2].label = name;
  }

  getVehicleName(): string {
    return this.vehicle?.vehicle_info?.the_basics?.[0]?.vehicleName
      || this.vehicle?.key_making_methods?.methods?.[0]?.vehicleName
      || 'Vehicle Details';
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  onYearChange(event: any) {
    const newId = event.target.value;
    if (newId) {
      this.router.navigate(['/', this.selectedMake, this.selectedModel, 'vehicle-details', newId]);
    }
  }

  getFirstProductId(ids: string): string {
    if (!ids) return '';
    return ids.split(',')[0].trim();
  }

  getTipsByCategory(cat: string): any[] {
    return this.vehicle?.tips_tricks_methods?.methods?.[cat] || [];
  }

  getCategoryIcon(cat: string): string {
    const icons: any = {
      'Key Programming': 'key-outline',
      'Lock Removal': 'construct-outline',
      'Remote Programming': 'share-outline'
    };
    return icons[cat] || 'alert-circle-outline';
  }

  getSafeUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  nextImage() {
    if (this.vehicle?.vehicle_image?.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.vehicle.vehicle_image.length;
    }
  }

  prevImage() {
    if (this.vehicle?.vehicle_image?.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.vehicle.vehicle_image.length) % this.vehicle.vehicle_image.length;
    }
  }

  setCurrentImage(index: number) {
    this.currentImageIndex = index;
  }

  formatLabel(key: string): string {
    if (!key) return '';
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  normalizeKey(key: any): string {
    if (!key) return '';
    return key
      .split('_')
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
