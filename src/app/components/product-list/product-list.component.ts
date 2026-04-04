import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline } from 'ionicons/icons';

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  qty: number;
  status: 'In Stock' | 'In Stock Soon' | 'Out of Stock';
  imageUrl: string;
  category: string;
  showPrice: boolean;
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
  
  allProducts: Product[] = [
    {
      id: '1502',
      sku: 'STR-597603',
      title: 'Ford 1996-2006 H72 w/Mercury Logo Transponder Key (STRATTEC)',
      price: 17.85,
      qty: 1,
      status: 'In Stock',
      imageUrl: '/assets/images/logo.png',
      category: 'Transponder Keys',
      showPrice: true
    },
    {
      id: '5326',
      sku: 'KLN-FD20U',
      title: 'Ford Horseshoe Blade H73 (KEYLINE FD20U)',
      price: 3.85,
      qty: 1,
      status: 'In Stock Soon',
      imageUrl: '/assets/images/logo.png',
      category: 'Horseshoe Blades',
      showPrice: true
    },
    {
      id: '5598',
      sku: 'ILC-EB3-C-H73',
      title: 'Ford H73 Horseshoe Blade for Cloning (ILCO EB3-C-H73)',
      price: 3.64,
      qty: 1,
      status: 'In Stock Soon',
      imageUrl: '/assets/images/logo.png',
      category: 'Horseshoe Blades',
      showPrice: false // Example of "Login to see price"
    },
    {
      id: '16121',
      sku: 'FOR-6U5T-191316-AE-RFB-B',
      title: 'Ford 2007-2009 3-Btn. RHK, 40-Bit (OUCD6000022)—OEM REFURB GREAT',
      price: 29.85,
      qty: 1,
      status: 'In Stock Soon',
      imageUrl: '/assets/images/logo.png',
      category: 'Remote Head Keys',
      showPrice: true
    },
    {
      id: '12121',
      sku: 'FOR-6U5T-191316-AE-RFB-B',
      title: 'Ford 2013-2019 3-Btn RHK 80-Bit (OUCD6000022)—OEM REFURB GREAT',
      price: 19.85,
      qty: 1,
      status: 'In Stock Soon',
      imageUrl: '/assets/images/logo.png',
      category: 'Remote Head Keys',
      showPrice: true
    },
  ];

  filteredProducts: Product[] = [];

  constructor(private route: ActivatedRoute) {
    addIcons({ addOutline, removeOutline, cartOutline, heartOutline, optionsOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.filterProducts();
    });
  }

  filterProducts() {
    if (!this.searchQuery) {
      this.filteredProducts = [...this.allProducts];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredProducts = this.allProducts.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
  }

  addToCart(product: Product) {
    console.log('Added to cart:', product.title, 'Qty:', product.qty);
  }

  incrementQty(product: Product) {
    product.qty++;
  }

  decrementQty(product: Product) {
    if (product.qty > 1) {
      product.qty--;
    }
  }
}
