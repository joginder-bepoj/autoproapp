import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule, IonContent } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline, alertCircleOutline, searchOutline, chevronDownOutline, chevronBackOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api-service';
import { catchError, combineLatest, finalize, forkJoin, map, of, switchMap } from 'rxjs';
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
  products_remote?: string;
  ez?: string;
  searchGroup?: 'EZ Product' | 'Standard Product';
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
  finalEzProducts: Product[] = [];
  finalStandardProducts: Product[] = [];
  ezCurrentPage: number = 1;
  ezTotalResults: number = 0;
  isLoadingMoreEz: boolean = false;

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
    this.products = [];
    this.finalEzProducts = [];
    this.finalStandardProducts = [];
    this.ezCurrentPage = 1;
    this.ezTotalResults = 0;

    const searchText = this.extractSearchText(this.searchQuery);

    forkJoin({
      productSearch: this.apiService.searchProducts(searchText),
      ezSearch: this.apiService.searchEzProducts(searchText, 1),
    })
      .pipe(
        switchMap(({ productSearch, ezSearch }: any) => {
          const standardProducts = this.getProductsFromResponse(productSearch);
          const productsToEnrich = standardProducts
            .filter((product: Product) => !product.products_remote && !product.ez && product.itemID)
            .slice(0, 15);

          if (!productsToEnrich.length) {
            return of({ standardProducts, ezSearch });
          }

          return forkJoin(
            productsToEnrich.map((product: Product) =>
              this.apiService.getProductRemote(product.itemID).pipe(
                map((res: any) => ({ product, remote: res?.data || res })),
                catchError(() => of({ product, remote: null })),
              )
            )
          ).pipe(
            map((remoteResults: any[]) => {
              remoteResults.forEach(({ product, remote }) => {
                product.products_remote = remote?.products_remote || product.products_remote;
                product.ez = remote?.ez || product.ez;
              });

              return { standardProducts, ezSearch };
            })
          );
        }),
        finalize(() => this.utilService.hideLoader())
      )
      .subscribe({
        next: ({ standardProducts, ezSearch }: any) => {
          const ezProducts = this.getProductsFromResponse(ezSearch);
          this.ezTotalResults = this.getTotalResultsFromResponse(ezSearch);
          this.applySearchResults(searchText, standardProducts, ezProducts);
        },
        error: (err: any) => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Search error:', err);
        }
      });
  }

  loadMoreEzProducts() {
    if (!this.canLoadMoreEz || this.isLoadingMoreEz) return;

    this.isLoadingMoreEz = true;
    const nextPage = this.ezCurrentPage + 1;
    const searchText = this.extractSearchText(this.searchQuery);

    this.apiService.searchEzProducts(searchText, nextPage)
      .pipe(finalize(() => this.isLoadingMoreEz = false))
      .subscribe({
        next: (res: any) => {
          this.ezCurrentPage = nextPage;
          const nextEzProducts = this.getProductsFromResponse(res).map((product: Product) => ({
            ...product,
            searchGroup: 'EZ Product' as const,
          }));

          this.finalEzProducts = this.mergeAndDeduplicateProducts([
            ...this.finalEzProducts,
            ...nextEzProducts,
          ]);
          this.products = this.mergeAndDeduplicateProducts([
            ...this.finalEzProducts,
            ...this.finalStandardProducts,
          ]);
          this.totalResults = this.products.length;
        },
        error: () => {
          this.error = 'Failed to load more EZ products. Please try again.';
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

  get canLoadMoreEz(): boolean {
    return !this.isCategoryPage && this.finalEzProducts.length < this.ezTotalResults;
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

  navigateToDetails(id: string) {
    this.router.navigate([this.searchQuery, 'product-details', id]);
  }

  trackByProductId(index: number, product: Product): string {
    return product.itemID;
  }

  private applySearchResults(searchText: string, standardProducts: Product[], ezProducts: Product[]) {
    const categorized = this.categorizeProducts(searchText, standardProducts);
    this.finalEzProducts = this.mergeAndDeduplicateProducts([
      ...ezProducts.map((product: Product) => ({ ...product, searchGroup: 'EZ Product' as const })),
      ...categorized.ezProducts,
    ]);
    this.finalStandardProducts = categorized.standardProducts;
    this.products = this.mergeAndDeduplicateProducts([
      ...this.finalEzProducts,
      ...this.finalStandardProducts,
    ]);
    this.totalResults = this.products.length;
  }

  private categorizeProducts(searchText: string, products: Product[]) {
    const normalizedSearch = this.normalizeSearchValue(searchText);
    const ezProducts: Product[] = [];
    const standardProducts: Product[] = [];

    products.forEach((product: Product) => {
      const remote = this.normalizeSearchValue(product.products_remote || '');
      const ez = this.normalizeSearchValue(product.ez || '');
      const isEzMatch = !!normalizedSearch && (remote.includes(normalizedSearch) || ez.includes(normalizedSearch));

      if (isEzMatch) {
        ezProducts.push({ ...product, searchGroup: 'EZ Product' });
      } else {
        standardProducts.push({ ...product, searchGroup: 'Standard Product' });
      }
    });

    return { ezProducts, standardProducts };
  }

  private mergeAndDeduplicateProducts(products: Product[]): Product[] {
    const seen = new Set<string>();

    return products.filter((product: Product) => {
      const id = product.itemID || (product as any).products_id || product.name;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private getProductsFromResponse(res: any): Product[] {
    return res?.data?.products || res?.products || [];
  }

  private getTotalResultsFromResponse(res: any): number {
    return Number(res?.data?.totalResults || res?.totalResults || this.getProductsFromResponse(res).length || 0);
  }

  private extractSearchText(value: string): string {
    const trimmed = (value || '').trim();

    try {
      const url = new URL(trimmed);
      const lastSegment = url.pathname.split('/').filter(Boolean).pop();
      return lastSegment || trimmed;
    } catch {
      return trimmed;
    }
  }

  private normalizeSearchValue(value: string): string {
    return (value || '').toString().trim().toLowerCase();
  }
}
