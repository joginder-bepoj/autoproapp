import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, chevronDownOutline, checkmarkCircleOutline, carOutline, buildOutline, alertCircleOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api-service';
import { finalize } from 'rxjs';
import { UtilService } from 'src/app/services/util.service';

interface OptionValue {
  id: string | number;
  name: string;
}

interface ProductOption {
  id: string | number;
  name: string;
  type: string;
  required: boolean;
  values: OptionValue[];
}

interface ProductDetails {
  itemID: string;
  sku: string;
  name: string;
  price: number;
  status: string;
  image: string;
  category: string;
  modelName: string;
  description: string;
  qtyOrder: number;
  options?: ProductOption[];
}

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DecimalPipe, RouterModule, BreadcrumbsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductDetailsComponent implements OnInit {
  breadcrumb: any = [];
  product: ProductDetails | null = null;
  selectedQty: number = 1;
  loading: boolean = false;
  error: string | null = null;
  selectedOptions: any = {};
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);


  constructor(private utilService: UtilService) {
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, chevronDownOutline, checkmarkCircleOutline, carOutline, buildOutline, alertCircleOutline, checkmarkOutline, closeOutline });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const search = params.get('search');
      const id = params.get('id');
      this.breadcrumb = [];

      if (search) {
        this.breadcrumb.push({ label: 'Products', url: '/product-list', query: { q: search } });
      }

      if (id) {
        this.fetchProduct(id);
      }
    });
  }

  fetchProduct(id: string) {
    this.loading = true;
    this.error = null;

    this.apiService.getProductDetail(parseInt(id))
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (res: any) => {
          if (res) {
            this.product = res.data;
          } else {


            this.error = 'Product information not available.';
          }
        },
        (err) => {
          console.error('Fetch product details error', err);
          this.error = 'Failed to load product details. Please try again later.';
        }
      );
  }

  incrementQty() {
    this.product && this.product.qtyOrder++;
  }

  decrementQty() {
    if (this.product && this.product.qtyOrder > 1) {
      this.product.qtyOrder--;
    }
  }

  getImageBaseUrl() {
    return this.utilService.getImgBaseUrl();
  }

  onOptionChange(optionId: any, value: any) {
    this.selectedOptions[optionId] = value;
  }


  addToCart() {

    this.utilService.addToCart(this.product);
  }
}

