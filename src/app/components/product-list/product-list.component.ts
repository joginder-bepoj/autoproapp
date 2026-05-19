import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule, IonContent } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline, alertCircleOutline, searchOutline, chevronDownOutline, chevronBackOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api-service';
import { combineLatest, finalize } from 'rxjs';
import { UtilService } from 'src/app/services/util.service';

interface Product {
  itemID: string;
  modelName: string;
  name: string;
  price: number;
  qty: number;
  inStock: boolean;
  image: string;
  category: string;
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DecimalPipe, RouterModule, BreadcrumbsComponent, FooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductListComponent implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  searchQuery: string = '';
  products: Product[] = [];
  loading: boolean = false;
  error: string | null = null;
  totalResults: number = 0;
  isLoggedIn: boolean = false;
  baseUrl: string;
  breadcrumb: any[] = [];
  isCategoryPage: boolean = false;
  categoryId: string = '';

  // Pagination properties
  currentPage: number = 0;
  displayResult: number = 60;

  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private utilService = inject(UtilService);

  constructor(private router: Router) {
    this.baseUrl = this.utilService.getImgBaseUrl();
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline, alertCircleOutline, searchOutline, chevronDownOutline, chevronBackOutline });
  }

  ngOnInit() {
    this.isLoggedIn = this.utilService.isLoggedIn();

    // Use combineLatest to handle both route params and query params in one go
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.categoryId = params['id'] || null;
      this.searchQuery = queryParams['q'] || '';

      this.handleRouting();
    });
  }

  handleRouting() {
    if (this.categoryId) {
      // CATEGORY PAGE
      this.isCategoryPage = true;
      this.breadcrumb = [
        { label: 'Product Category', url: '/product-category' },
      ];
      this.fetchCategoryProducts(0); // use categoryId, page 0
    } else if (this.searchQuery) {
      // SEARCH PAGE
      this.isCategoryPage = false;

      this.fetchProducts(0); // use searchQuery, page 0
    } else {
      // DEFAULT CASE (optional)
      this.isCategoryPage = false;
    }
  }

  fetchProducts(page: number = 0) {
    this.currentPage = page;
    this.utilService.showLoader();
    this.error = null;

    this.apiService.searchProducts(this.searchQuery, page)
      .pipe(finalize(() => this.utilService.hideLoader()))
      .subscribe({
        next: (res: any) => {
          this.products = res?.data?.products || [];
          this.totalResults = res?.data?.totalResults || 0;
          this.displayResult = res?.data?.displayResult || 60;
          console.log(this.products, 'i am the products');
        },
        error: (err: any) => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Search error:', err);
        }
      });
  }

  fetchCategoryProducts(page: number = 0) {
    this.currentPage = page;
    this.utilService.showLoader();
    this.error = null;

    this.apiService.getProductsByCategory(this.categoryId, page)
      .pipe(finalize(() => this.utilService.hideLoader()))
      .subscribe({
        next: (res: any) => {
          this.products = res?.data?.products || [];
          this.totalResults = res?.data?.totalResults || 0;
          this.displayResult = res?.data?.displayResult || 60;
          console.log(this.products, 'i am the products');
        },
        error: (err: any) => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Search error:', err);
        }
      });
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.displayResult) || 1;
  }

  get visiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get isLastPageHidden(): boolean {
    return this.totalPages > 1 && !this.visiblePages.includes(this.totalPages - 1);
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    if (this.isCategoryPage) {
      this.fetchCategoryProducts(page);
    } else {
      this.fetchProducts(page);
    }
    // Smooth scroll to top of page when changing page
    this.content?.scrollToTop(400);
  }

  addToCart(product: Product) {
    this.utilService.addToCart({
      itemID: product.itemID,
      qtyOrder: product.qty || 1
    });
  }

  incrementQty(product: Product) {
    product.qty++;
  }

  decrementQty(product: Product) {
    if (product.qty > 1) {
      product.qty--;
    }
  }

  getImageBaseUrl() {
    return this.utilService.getImgBaseUrl();
  }

  getProductStatus(product: Product) {
    return product.inStock ? 'ADD TO CART' : 'IN STOCK SOON';
  }

  navigateToDetails(id: string) {
    this.router.navigate([this.searchQuery, 'product-details', id]);
  }

  trackByProductId(index: number, product: Product): string {
    return product.itemID;
  }
}

