import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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

  pendingUpdates = new Set<number>();
  private cartUpdateSubject = new Subject<{ item: any, qty: number }>();

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
      if (!cart) return;
      this.cart = cart;
      const newItems = cart.products || [];
      this.items = newItems.map((newItem: any) => {
        const existingLocal = this.items.find(i => i.itemID === newItem.itemID);
        if (existingLocal && this.pendingUpdates.has(newItem.itemID)) {
          if (newItem.qty === existingLocal.qty) {
            this.pendingUpdates.delete(newItem.itemID);
            return newItem;
          } else {
            return { ...newItem, qty: existingLocal.qty };
          }
        }
        return newItem;
      });

      // this.recalculateLocally();
    });
    this.cartUpdateSubject.pipe(
      debounceTime(500)
    ).subscribe(({ item, qty }) => {
      this.utilService.updateCartQty({ ...item, qty });
      this.pendingUpdates.delete(item.itemID);
    });
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


  incrementQty(item: any) {
    item.qty = (item.qty || 1) + 1;
    this.pendingUpdates.add(item.itemID);
    this.cartUpdateSubject.next({ item, qty: item.qty });
  }

  decrementQty(item: any) {
    if ((item.qty || 1) <= 1) {
      this.removeItem(item);
      return;
    }
    item.qty = (item.qty || 1) - 1;
    this.pendingUpdates.add(item.itemID);
    this.cartUpdateSubject.next({ item, qty: item.qty });
  }

  removeItem(item: any) {
    this.items = this.items.filter(i => i.itemID !== item.itemID);
    this.utilService.removeFromCart(item);
  }

  getImageBaseUrl() {
    return this.utilService.getImgBaseUrl();
  }

}
