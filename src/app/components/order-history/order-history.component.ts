import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonSkeletonText } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, receiptOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

type NormalizedOrder = {
  id: string;
  orderDateLabel: string;
  orderNumberLabel: string;
  orderTotalLabel: string;
  orderStatusLabel: string;
  trackingLabel: string;

  orderDate: string;
  orderNumber: string;
  orderTotal: string;
  orderStatus: string;
  tracking: string;
};

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSkeletonText,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class OrderHistoryComponent implements OnInit {

  isLoading = false;
  orders: NormalizedOrder[] = [];

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router,
  ) {
    addIcons({ chevronForwardOutline, receiptOutline });
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.utilService.showLoader();

    this.apiService.getOrderHistory().subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        this.isLoading = false;

        const rawList = this.extractOrders(res);
        this.orders = rawList.map((o) => this.normalizeOrder(o));
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.isLoading = false;
        console.error('Error fetching order history:', err);
        this.orders = [];
      },
    });
  }

  private extractOrders(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.customerOrderHistory)) return res.data.customerOrderHistory;
    if (Array.isArray(res?.orders)) return res.orders;
    if (Array.isArray(res?.result)) return res.result;
    return [];
  }

  private normalizeOrder(order: any): NormalizedOrder {
    const orderDateRaw = this.pick(order, [
      'order_date',
      'orderDate',
      'date',
      'created_at',
      'createdAt',
    ]);

    const orderNumberRaw = this.pick(order, [
      'order_number',
      'orderNumber',
      'order_no',
      'orderNo',
      'order_id',
      'orderId',
    ]);

    const orderIdRaw = this.pick(order, [
      'id',
      'order_id',
      'orderId',
      'order_number',
      'orderNumber',
    ]);

    const orderTotalRaw = this.pick(order, [
      'order_total',
      'orderTotal',
      'total',
      'amount',
      'grand_total',
      'grandTotal',
    ]);

    const orderStatusRaw = this.pick(order, [
      'order_status',
      'orderStatus',
      'status',
      'state',
    ]);

    const orderStatusDescRaw = this.pick(order, [
      'statusDescrip',
      'statusDescription',
      'status_description',
      'description',
    ]);

    const trackingRaw = this.pick(order, [
      'tracking',
      'tracking_number',
      'trackingNumber',
      'tracking_no',
      'trackingNo',
    ]);

    const status = this.toDisplayString(orderStatusRaw);
    const statusDesc = this.toDisplayString(orderStatusDescRaw);
    const statusLabel = status && statusDesc ? `${status} (${statusDesc})` : (status || statusDesc);

    return {
      id: this.toDisplayString(orderIdRaw),
      orderDateLabel: 'Order Date',
      orderNumberLabel: 'Order #',
      orderTotalLabel: 'Order Total',
      orderStatusLabel: 'Order Status',
      trackingLabel: 'Tracking',

      orderDate: this.formatDate(orderDateRaw),
      orderNumber: this.toDisplayString(orderNumberRaw),
      orderTotal: this.formatMoney(orderTotalRaw),
      orderStatus: statusLabel,
      tracking: this.toDisplayString(trackingRaw) || 'None',
    };
  }

  private pick(obj: any, keys: string[]): any {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  }

  private toDisplayString(value: any): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    return String(value);
  }

  private formatDate(value: any): string {
    const str = this.toDisplayString(value);
    if (!str) return '';

    // If API already sends human format (e.g. 02/02/2026) keep it.
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(str)) return str;

    const asNumber = Number(str);
    const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(str);
    if (isNaN(date.getTime())) return str;

    return date.toLocaleDateString();
  }

  private formatMoney(value: any): string {
    const str = this.toDisplayString(value);
    if (!str) return '';

    const amount = Number(str.replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(amount)) return str;

    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  openOrder(order: NormalizedOrder) {
    if (!order?.id) return;
    this.router.navigate(['/order-history', order.id]);
  }

}
