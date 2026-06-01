import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { IonIcon, IonContent } from "@ionic/angular/standalone";
import { CommonModule, TitleCasePipe, DecimalPipe, DatePipe, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
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
  chevronBackOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-vehicle-details',
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    BreadcrumbsComponent,
    CommonModule,
    RouterModule,
    TitleCasePipe,
    DecimalPipe,
    DatePipe,
    NgIf,
    FooterComponent,
    FormsModule
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
  available_cuts: number[] = [];
  keyCuttingData: Record<string, any> | null = null;
  keyProgrammingData: Record<string, any> | null = null;
  keyProgrammingRating: Record<string, any> | null = null;
  isCommentsModalOpen: boolean = false;
  selectedTool: string = '';
  isAddCommentModalOpen: boolean = false;
  addCommentTool: string = '';
  addCommentResult: boolean = true;
  selectedKeyType: string = 'Standard Transponder';
  commentText: string = '';
  keyTypes: string[] = [
    'Standard Transponder',
    'Remote (no chip)',
    'Remote Head Key',
    'Smart Key(Prox)'
  ];

  breadcrumb: any[] = [
    { label: 'Vehicle Search', url: '/category' },
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
      chevronBackOutline,
      closeOutline
    });
    this.imgBaseUrl = this.utilService.getImgBaseUrl();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '';
      this.selectedMake = params.get('make') || '';
      this.selectedModel = params.get('model') || '';

      const from = this.route.snapshot.queryParamMap.get('from');

      if (from === 'history' || (!this.selectedMake && !this.selectedModel)) {
        this.breadcrumb = [
          { label: 'Search History', url: '/search-history' }
        ];
      } else {
        this.breadcrumb = [
          { label: 'Vehicle Search', url: '/category' }
        ];
      }

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

    this.apiService.getVehicleKeyProgrammingRating(id).subscribe({
      next: (res: any) => {
        console.log(res)
        if (res) {
          this.keyProgrammingRating = res;
        }
      },
      error: () => {
        this.keyProgrammingRating = null;
      }
    })
  }

  cutsArray(length: number): number[] {
    return Array.from({ length: length }, (_, i) => i);
  }

  parseVehicleData() {
    if (!this.vehicle) return;

    // 1. Tumbler Data
    this.tumblerRows = [];
    const td = this.vehicle.tubmler_data;
    if (td) {
      let maxCuts = 0;
      Object.keys(td).forEach((key: any) => {
        const rowData = td[key] || [];
        if (rowData.length > maxCuts) {
          maxCuts = rowData.length;
        }

        const label = key.replace(/^[A-Z]_/, '').replace(/_/g, ' ');
        this.tumblerRows.push({
          label: label,
          values: rowData
        });
      });
      this.available_cuts = this.cutsArray(maxCuts);
    }

    // 2. Keys
    const keys = this.vehicle.vehicle_info?.the_keys?.key_type;
    const filterEmpty = (list: any[]) => (list || []).filter(item => {
      if (!item) return false;
      const hasValue = item.value && item.value.trim() !== '';
      const hasProducts = item.products && (typeof item.products === 'object' ? Object.keys(item.products).length > 0 : item.products.trim() !== '');
      return hasValue || hasProducts;
    });

    this.mechanicalKeys = filterEmpty(keys?.Mechanical_Key);
    this.transponderKeys = filterEmpty(keys?.Transponder_Key);

    // 3. Remotes
    const remotesInput = this.vehicle.vehicle_info?.the_remotes || [];
    this.remotes = (Array.isArray(remotesInput) ? remotesInput : [remotesInput]).filter(item => {
      if (!item) return false;
      return item.name && item.name.trim() !== '';
    });

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

    // 9. Key Cutting
    this.keyCuttingData = this.vehicle.vehicle_info.key_cutting;

    // 10. Key Programming
    this.keyProgrammingData = this.vehicle.vehicle_info?.key_programming;

    // 11. Breadcrumb update
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

  formatLabel(key: any): string {
    if (!key) return '';
    return key
      .split('_')
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  normalizeKey(key: any): string {
    if (!key) return '';
    return key
      .split('_')
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getDisplayValue(val: any): string {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      return val.value || 'N/A';
    }
    return val;
  }

  getEntries(obj: any): any[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }

  getFilteredEntries(obj: any): any[] {
    if (!obj) return [];
    return Object.entries(obj)
      .filter(([_, value]: [string, any]) => {
        if (value === null || value === undefined || value === '' || value === '-' || value === 'N/A') return false;
        if (typeof value === 'object' && (!value.value || value.value === '-' || value.value === '')) return false;
        return true;
      })
      .map(([key, value]) => ({ key, value }));
  }

  reportProgrammingResult(tool: string, worked: boolean) {
    console.log(`Reporting ${worked ? 'Success' : 'Failure'} for ${tool}`);
    this.addCommentTool = tool;
    this.addCommentResult = worked;
    this.selectedKeyType = 'Standard Transponder';
    this.commentText = '';
    this.isAddCommentModalOpen = true;
  }

  closeAddCommentModal() {
    this.isAddCommentModalOpen = false;
  }

  submitRating(skipComment: boolean = false) {
    const userProfile = this.utilService.getUserProfile();
    const userID = userProfile?.customerID || userProfile?.userID || '16883';
    const userName = userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'Sirima Rivera';
    
    const ratingData = {
      comment: skipComment ? '' : this.commentText,
      keyType: this.selectedKeyType,
      programmer: this.addCommentTool,
      result: this.addCommentResult ? 'working' : 'not_working',
      time: Date.now(),
      userID: userID.toString(),
      userName: userName,
      vehicleID: this.route.snapshot.paramMap.get('id') || ''
    };

    this.utilService.showLoader();
    this.apiService.addVehicleKeyProgrammingRating(ratingData.vehicleID, ratingData).subscribe({
      next: () => {
        this.utilService.hideLoader();
        this.utilService.showToast('Thank you for your report!', 'success');
        this.closeAddCommentModal();
        // Refresh ratings
        const id = this.route.snapshot.paramMap.get('id') || '';
        if (id) {
          this.fetchVehicle(id);
        }
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.utilService.showToast('Failed to submit report. Please try again.', 'danger');
        console.error(err);
      }
    });
  }

  viewToolComments(tool: string) {
    console.log(`Viewing comments for ${tool}`);
    this.selectedTool = tool;
    this.isCommentsModalOpen = true;
  }

  closeCommentsModal() {
    this.isCommentsModalOpen = false;
    this.selectedTool = '';
  }

  getCommentsCount(tool: string): number {
    if (!this.keyProgrammingRating?.[tool]) return 0;
    return Object.values(this.keyProgrammingRating[tool]).filter((item: any) => item?.comment && item.comment.trim() !== '').length;
  }

  getSelectedToolComments(): any[] {
    if (!this.selectedTool || !this.keyProgrammingRating?.[this.selectedTool]) return [];
    return Object.values(this.keyProgrammingRating[this.selectedTool])
      .filter((item: any) => item?.comment && item.comment.trim() !== '')
      .sort((a: any, b: any) => (b.time || 0) - (a.time || 0));
  }

  getVehicleYearsRange(): string {
    if (!this.vehicle?.years || !this.vehicle.years.length) return '';
    const years = this.vehicle.years.map((y: any) => parseInt(y.year)).filter((y: any) => !isNaN(y));
    if (!years.length) return '';
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
  }

  addToCart(product: any, type: 'key' | 'remote' | 'part') {
    let itemID = '';
    if (type === 'key' || type === 'remote') {
      if (product.products?.products_id) {
        itemID = this.getFirstProductId(product.products.products_id);
      }
    } else if (type === 'part') {
      itemID = product.itemID;
    }

    if (!itemID) {
      this.utilService.showToast('Product ID not found', 'danger');
      return;
    }

    this.utilService.addToCart({
      itemID: itemID,
      qtyOrder: 1
    });
  }

  getWorkingScore(tool: string) {
    let totalWorking = Object.values(this.keyProgrammingRating?.[tool] || {}).filter((item: any) => item?.result === 'working')
    return totalWorking.length;
  }

  getNotWorkingScore(tool: string) {
    let totalNotWorking = Object.values(this.keyProgrammingRating?.[tool] || {}).filter((item: any) => item?.result === 'not_working' || !item?.result)
    return totalNotWorking.length;
  }

  getSuccessRate(tool: string) {
    const values = Object.values(this.keyProgrammingRating?.[tool] || {});
    if (!values.length) return '0%';
    let totalSuccessRate = values.filter((item: any) => item?.result === 'working')
    return ((totalSuccessRate.length / values.length) * 100).toFixed(0) + '%';
  }


}
