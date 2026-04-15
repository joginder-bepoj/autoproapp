import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline, alertCircleOutline, searchOutline } from 'ionicons/icons';
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
  imports: [CommonModule, IonicModule, DecimalPipe, RouterModule, BreadcrumbsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductListComponent implements OnInit {
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


  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private utilService = inject(UtilService);

  constructor(private router: Router) {
    this.baseUrl = this.utilService.getImgBaseUrl();
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline, alertCircleOutline, searchOutline });
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
      this.fetchCategoryProducts(); // use categoryId
    } else if (this.searchQuery) {
      // SEARCH PAGE
      this.isCategoryPage = false;

      this.fetchProducts(); // use searchQuery
    } else {
      // DEFAULT CASE (optional)
      this.isCategoryPage = false;
    }
  }

  fetchProducts() {
    this.loading = true;
    this.error = null;

    this.apiService.searchProducts(this.searchQuery)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (res: any) => {
          this.products = res?.data?.products;
          this.totalResults = res?.data?.totalResults;
          console.log(this.products, 'i am the products');
        },
        (err: any) => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Search error:', err);
        }
      );
  }

  addToCart(product: Product) {
    console.log('Added to cart:', product.name, 'Qty:', product.qty);
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

  fetchCategoryProducts() {
    this.loading = true;
    this.error = null;

    this.apiService.getProductsByCategory(this.categoryId)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (res: any) => {
          this.products = res?.data?.products;
          this.totalResults = res?.data?.totalResults;
          console.log(this.products, 'i am the products');
        },
        (err: any) => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Search error:', err);
        }
      );
  }

}

