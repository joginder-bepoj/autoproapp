import { FooterComponent } from 'src/app/shared/footer/footer.component';
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
  imports: [CommonModule, IonicModule, RouterModule, BreadcrumbsComponent, FooterComponent]
})
export class ShoppingCartComponent implements OnInit, OnDestroy {
  cart: any = null;
  items: any[] = [];
  loading: boolean = false;

  // Totals
  // subtotal: number = 0;

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
      console.log(cart.subTotal)
      // this.calculateTotals();
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
        this.utilService.showToast('Something went wrong', 'danger');
        this.loading = false;
      }
    });
  }

  calculateTotals() {
    // Assuming each item has price and qty
    // this.subtotal =
    // this.tax = this.subtotal * 0.08; // Example 8% tax
    // this.shipping = this.subtotal > 0 ? 15 : 0; // Flat shipping
    // this.total = this.subtotal + this.tax + this.shipping;
  }

  incrementQty(item: any) {
    item.qty++;
    this.utilService.updateCartQty(item);
  }

  decrementQty(item: any) {
    item.qty--;
    this.utilService.updateCartQty(item);
  }

  removeItem(item: any) {
    this.items = this.items.filter(i => i.itemID !== item.itemID);
    this.utilService.removeFromCart(item);
  }

  getImageBaseUrl() {
    return this.utilService.getImgBaseUrl();
  }

  trackByItemId(index: number, item: any): string {
    return item.itemID;
  }
}
