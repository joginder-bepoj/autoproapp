import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, checkmarkCircleOutline, carOutline, buildOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api-service';
import { finalize } from 'rxjs';

interface ProductDetails {
  id: string;
  sku: string;
  title: string;
  price: number;
  status: string;
  imageUrl: string;
  category: string;
  itemNumber: string;
  modelNumber: string;
  description: string;
  compatibilityTabs: {
      title: string;
      vehicles: string[];
  }[];
  specifications: {
      label: string;
      value: string;
  }[];
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
  product: ProductDetails | null = null;
  selectedQty: number = 1;
  loading: boolean = false;
  error: string | null = null;

  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  constructor() {
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, checkmarkCircleOutline, carOutline, buildOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
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
            this.product = {
              id: id,
              sku: res.item_code || res.sku || 'N/A',
              title: res.item_name || res.title,
              price: parseFloat(res.price) || 0,
              status: res.stock_status || 'In Stock',
              imageUrl: res.image || '/assets/images/logo.png',
              category: res.category_name || 'Automotive',
              itemNumber: `#${id}`,
              modelNumber: res.item_code || 'STR-597603',
              description: res.description || 'Professional automotive key solution. Please consult with a certified locksmith for programming and cutting.',
              compatibilityTabs: res.compatibility || [
                {
                  title: 'Compatible Vehicles',
                  vehicles: ['Loading compatibility data...']
                }
              ],
              specifications: res.specs || [
                { label: 'Manufacturer', value: res.manufacturer || 'AutoPro' },
                { label: 'Technical Code', value: res.item_code || 'N/A' },
                { label: 'Item Type', value: res.category_name || 'Key' }
              ]
            };
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
    this.selectedQty++;
  }

  decrementQty() {
    if (this.selectedQty > 1) {
      this.selectedQty--;
    }
  }

  addToCart() {
    if (this.product) {
      console.log('Adding to cart:', this.product.title, 'Qty:', this.selectedQty);
    }
  }
}

