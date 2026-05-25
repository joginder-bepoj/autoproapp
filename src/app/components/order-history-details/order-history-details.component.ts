import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronForwardOutline, receiptOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

type OrderItemVM = {
  name: string;
  sku: string;
  modelName: string;
  qty: string;
  price: string;
  total: string;
};

@Component({
  selector: 'app-order-history-details',
  templateUrl: './order-history-details.component.html',
  styleUrls: ['./order-history-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class OrderHistoryDetailsComponent implements OnInit {

  isLoading = false;
  orderId = '';
  order: any = null;
  items: OrderItemVM[] = [];
  deliveryAddressText = '';
  billingAddressText = '';
  comments: { commentDate: string; comment: string; status: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private utilService: UtilService,
  ) {
    addIcons({ arrowBackOutline, chevronForwardOutline, receiptOutline });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/order-history']);
      return;
    }
    this.orderId = id;
    this.loadDetails(id);
  }

  goBack() {
    this.router.navigate(['/order-history']);
  }

  private loadDetails(orderId: string) {
    this.isLoading = true;
    this.utilService.showLoader();

    this.apiService.getOrderHistoryDetails(orderId).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        this.isLoading = false;

        const payload = (res?.data?.data ?? res?.data ?? res);
        this.order = payload;
        this.deliveryAddressText = this.formatAddress(payload?.deliveryAddress);
        this.billingAddressText = this.formatAddress(payload?.billingAddress);
        this.comments = Array.isArray(payload?.orderComments) ? payload.orderComments : [];
        this.items = this.normalizeItems(payload);
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.isLoading = false;
        console.error('Error fetching order history details:', err);
        this.order = null;
        this.items = [];
        this.deliveryAddressText = '';
        this.billingAddressText = '';
        this.comments = [];
      },
    });
  }

  private normalizeItems(payload: any): OrderItemVM[] {
    const list = payload?.itemsPurchased ?? payload?.items ?? payload?.orderItems ?? payload?.products ?? [];

    if (!Array.isArray(list)) return [];

    return list.map((item: any) => {
      const name = this.toDisplayString(item?.name ?? item?.productName ?? item?.title);
      const sku = this.toDisplayString(item?.sku ?? item?.productSku ?? item?.partNumber ?? item?.itemID);
      const modelName = this.toDisplayString(item?.modelName ?? item?.model ?? item?.mpn);
      const qty = this.toDisplayString(item?.qty ?? item?.quantity ?? item?.qtyOrdered);
      const price = this.formatMoney(item?.price ?? item?.unitPrice ?? item?.itemPrice);
      const total = this.formatMoney(item?.total ?? item?.rowTotal ?? item?.lineTotal ?? item?.itemTotal);

      return { name, sku, modelName, qty, price, total };
    });
  }

  toDisplayString(value: any): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    return String(value);
  }

  formatMoney(value: any): string {
    const str = this.toDisplayString(value);
    if (!str) return '';

    const amount = Number(str.replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(amount)) return str;

    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  private formatAddress(address: any): string {
    if (!address) return '';

    const parts = [
      this.toDisplayString(address?.name),
      this.toDisplayString(address?.company),
      this.toDisplayString(address?.streetAddress),
      this.toDisplayString(address?.suburb),
      this.toDisplayString(address?.city),
      this.toDisplayString(address?.state),
      this.toDisplayString(address?.country),
      this.toDisplayString(address?.postalCode),
    ].filter(Boolean);

    return parts.join(', ');
  }

}
