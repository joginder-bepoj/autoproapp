import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { UtilService } from '../../services/util.service';
import { ApiService } from '../../services/api-service';
import { addIcons } from 'ionicons';
import {
  addOutline,
  removeOutline,
  trashOutline,
  cartOutline,
  arrowBackOutline,
  chevronForwardOutline,
  pricetagOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, BreadcrumbsComponent]
})
export class ShoppingCartComponent implements OnInit, OnDestroy {
  cart: any = null;
  items: any[] = [];
  loading: boolean = false;

  // Totals
  subtotal: number = 0;
  tax: number = 0;
  shipping: number = 0;
  total: number = 0;

  breadcrumb: any[] = [
    { label: 'Shopping Cart', url: '/cart' }
  ];



  private utilService = inject(UtilService);
  private apiService = inject(ApiService);
  private cartSubscription: Subscription | undefined;

  constructor() {
    addIcons({
      addOutline,
      removeOutline,
      trashOutline,
      cartOutline,
      arrowBackOutline,
      chevronForwardOutline,
      pricetagOutline,
      lockClosedOutline
    });
  }

  ngOnInit() {
    this.cartSubscription = this.utilService.cart$.subscribe(cart => {
      this.cart = cart;
      this.items = cart?.products || []; // Adjust based on actual API structure
      this.calculateTotals();
    });

    // Initial fetch if needed
    if (!this.cart) {
      this.fetchCart();
    }
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  fetchCart() {
    this.utilService.showLoader();
    this.apiService.getCartItems().subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        if (res && res.data) {
          this.utilService.setCart(res.data);
        }
        this.loading = false;
      },
      error: () => {
        this.utilService.hideLoader();
        alert("Something went wrong");
        this.loading = false;
      }
    });
  }

  calculateTotals() {
    // Assuming each item has price and qty
    this.subtotal = this.items.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
    this.tax = this.subtotal * 0.08; // Example 8% tax
    this.shipping = this.subtotal > 0 ? 15 : 0; // Flat shipping
    this.total = this.subtotal + this.tax + this.shipping;
  }

  incrementQty(item: any) {
    // Optimistic UI update or API call?
    // Since we don't have a direct "updateQty" API yet, we'll simulate logic
    item.qty = (item.qty || 1) + 1;
    this.calculateTotals();
    // In a real app, you'd call this.apiService.updateCart(...)
  }

  decrementQty(item: any) {
    if (item.qty > 1) {
      item.qty--;
      this.calculateTotals();
    }
  }

  removeItem(item: any) {
    // Filter locally for now
    this.items = this.items.filter(i => i.itemID !== item.itemID);
    this.calculateTotals();
    // Update the service so header badge updates
    this.utilService.setCart({ ...this.cart, products: this.items });
  }

  getImageBaseUrl() {
    return this.utilService.getImgBaseUrl();
  }
}
