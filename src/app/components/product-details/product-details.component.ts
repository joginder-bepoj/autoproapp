import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, checkmarkCircleOutline, carOutline, buildOutline } from 'ionicons/icons';

interface ProductDetails {
  id: string;
  sku: string;
  title: string;
  price: number;
  status: 'In Stock' | 'In Stock Soon' | 'Out of Stock';
  imageUrl: string;
  category: string;
  vatsValue: string;
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

  constructor(private route: ActivatedRoute) {
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, shareOutline, chevronForwardOutline, checkmarkCircleOutline, carOutline, buildOutline });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.loadProduct(id);
    });
  }

  loadProduct(id: string | null) {
    // Mock data based on the "old" design provided
    this.product = {
      id: id || '1502',
      sku: 'STR-597603',
      title: 'Ford 1996-2006 H72 w/Mercury Logo Transponder Key (STRATTEC)',
      price: 17.85,
      status: 'In Stock',
      imageUrl: '/assets/images/logo.png',
      category: 'Transponder Keys',
      vatsValue: 'N/A',
      itemNumber: '#1502',
      modelNumber: 'STR-597603',
      description: 'High-quality transponder key for Ford vehicles. Features the original Mercury logo and is manufactured by STRATTEC for maximum reliability and exact fitment. This key requires professional programming by a locksmith or dealer.',
      compatibilityTabs: [
        {
          title: 'Compatible Vehicles',
          vehicles: [
            'Ford Cobra 1997',
            'Ford Crown Victoria 1998-2002',
            'Ford Excursion 2000-2006',
            'Ford Expedition 1997-2002',
            'Ford Explorer 1998-2001',
            'Ford Explorer Sport 1999-2001',
            'Ford F150 1999-2003',
            'Ford F150 Light Duty 1999-2003',
            'Ford F150 Heritage 2004',
            'Ford F250 1999-2003',
            'Ford F250 Light Duty 1999-2003'
          ]
        }
      ],
      specifications: [
        { label: 'Manufacturer', value: 'STRATTEC' },
        { label: 'Chip Type', value: 'Transponder' },
        { label: 'Key Way', value: 'H72' },
        { label: 'Logo', value: 'Mercury' },
        { label: 'VATs Value', value: 'N/A' }
      ]
    };
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
