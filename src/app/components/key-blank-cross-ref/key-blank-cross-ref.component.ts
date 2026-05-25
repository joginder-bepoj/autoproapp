import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { addIcons } from 'ionicons';
import {
  searchOutline, keyOutline, arrowBackOutline,
  checkmarkCircleOutline, closeCircleOutline,
  refreshOutline, informationCircleOutline, alertCircleOutline, imageOutline,
  chevronForwardOutline, addOutline, removeOutline, cartOutline,
  bulbOutline, fingerPrintOutline, cloudOfflineOutline,
  swapHorizontal, gitMerge
} from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SearchResultItem {
  manufacturer: string;
  matchedCode: string;
  record: any;
}

@Component({
  selector: 'app-key-blank-cross-ref',
  templateUrl: './key-blank-cross-ref.component.html',
  styleUrls: ['./key-blank-cross-ref.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, FooterComponent]
})
export class KeyBlankCrossRefComponent implements OnInit {

  keyName: string = '';
  exactMatchOnly: boolean = false;
  // isLoading: boolean = false;
  hasSearched: boolean = false;

  searchResults: SearchResultItem[] = [];
  selectedResult: SearchResultItem | null = null;
  detailProducts: any[] = [];
  // isLoadingProducts: boolean = false;
  detailImageError: boolean = false;

  private allKeyBlanks: any[] = [];
  isDataLoaded: boolean = false;
  loadError: string | null = null;

  private readonly MFG_LIST = [
    'Ilco', 'JMA', 'Taylor', 'Silca', 'Curtis',
    'Jet', 'Axxess', 'ESP', 'Hillman', 'Strattec', 'OEM', 'Other'
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private utilService: UtilService
  ) {
    addIcons({
      searchOutline, keyOutline, arrowBackOutline,
      checkmarkCircleOutline, closeCircleOutline,
      refreshOutline, informationCircleOutline, alertCircleOutline, imageOutline,
      chevronForwardOutline, addOutline, removeOutline, cartOutline,
      bulbOutline, fingerPrintOutline, cloudOfflineOutline,
      swapHorizontal, gitMerge
    });
  }

  ngOnInit(): void {
    this.loadKeyBlanks();
  }

  loadKeyBlanks() {
    this.utilService.showLoader();
    this.loadError = null;
    this.apiService.getKeyBlanks().subscribe({
      next: (res: any) => {
        if (res && typeof res === 'object') {
          const rawList = Array.isArray(res) ? res : Object.values(res);
          this.allKeyBlanks = rawList.filter(
            item => item !== null && item !== undefined && typeof item === 'object'
          );
        } else {
          this.allKeyBlanks = [];
        }
        this.utilService.hideLoader();
        this.isDataLoaded = true;
      },
      error: (err: any) => {
        console.error('Error fetching key blanks:', err);
        this.utilService.hideLoader();
        this.loadError = 'Failed to load key blank database. Please check your internet connection and try again.';
      }
    });
  }

  goBack() {
    if (this.selectedResult) {
      this.selectedResult = null;
      this.detailProducts = [];
      this.detailImageError = false;
    } else {
      this.router.navigate(['/home']);
    }
  }

  search() {
    const query = this.keyName.trim().toUpperCase();
    if (!query || !this.isDataLoaded) return;

    this.utilService.showLoader();
    this.hasSearched = false;
    this.selectedResult = null;
    this.detailProducts = [];
    this.searchResults = [];

    const results: SearchResultItem[] = [];
    const seen = new Set<string>();

    for (const item of this.allKeyBlanks) {
      const name = (item.Name || '').trim().toUpperCase();
      let itemMatched = false;

      for (const mfg of this.MFG_LIST) {
        const fieldVal = (item[mfg] || '').trim();
        if (!fieldVal || fieldVal === '-') continue;

        const tokens = fieldVal.split(/\s+/).filter((t: string) => t && t !== '-');

        for (const token of tokens) {
          const tokenUpper = token.toUpperCase();
          const isMatch = this.exactMatchOnly
            ? tokenUpper === query
            : tokenUpper.includes(query);

          if (isMatch) {
            const key = `${item.Name}||${mfg}||${token}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ manufacturer: mfg, matchedCode: token, record: item });
            }
            itemMatched = true;
            break; // one token match per mfg field per item
          }
        }
      }

      // Fallback: name-based partial match (only if no mfg field matched)
      if (!itemMatched && !this.exactMatchOnly && name.includes(query)) {
        for (const mfg of this.MFG_LIST) {
          const fieldVal = (item[mfg] || '').trim();
          if (!fieldVal || fieldVal === '-') continue;
          const tokens = fieldVal.split(/\s+/).filter((t: string) => t && t !== '-');
          if (tokens.length > 0) {
            const key = `${item.Name}||${mfg}||${tokens[0]}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ manufacturer: mfg, matchedCode: tokens[0], record: item });
            }
            break;
          }
        }
      }
    }

    this.searchResults = results;
    this.utilService.hideLoader();
    this.hasSearched = true;
  }

  selectResult(result: SearchResultItem) {
    this.selectedResult = result;
    this.detailImageError = false;
    this.detailProducts = [];
    this.loadProductsForDetail(result.record.products?.products_id || '');
  }

  loadProductsForDetail(productsIdStr: string) {
    this.utilService.showLoader();
    if (!productsIdStr || productsIdStr.trim() === '') return;

    const ids = productsIdStr
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((id: number) => !isNaN(id) && id > 0);

    if (ids.length === 0) return;

    this.utilService.hideLoader();

    const requests = ids.map((id: number) =>
      this.apiService.getProductDetail(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe((results: any[]) => {
      this.detailProducts = results
        .filter((r: any) => r && r.data)
        .map((r: any) => ({ ...r.data, qtyOrder: 1 }));
      this.utilService.hideLoader();
    });
  }

  getDetailImage(): string | null {
    if (!this.selectedResult) return null;
    const record = this.selectedResult.record;
    const baseUrl = this.utilService.getImgBaseUrl();

    const imgName = (record.Images || '').trim();
    const prodImgName = (record.products?.imagePath || '').trim();

    let validImgName = '';
    if (imgName && imgName !== '-' && imgName.toLowerCase() !== 'noimage.jpg') {
      validImgName = imgName;
    } else if (
      prodImgName && prodImgName !== '-' &&
      prodImgName.toLowerCase() !== 'noimage.jpg' &&
      prodImgName !== ''
    ) {
      validImgName = prodImgName;
    }

    return validImgName ? baseUrl + validImgName : null;
  }

  getSelectedMfgFullCodes(): string {
    if (!this.selectedResult) return '';
    const record = this.selectedResult.record;
    const mfg = this.selectedResult.manufacturer;
    return (record[mfg] || '').trim();
  }

  getOtherMfgCodes(): Array<{ brand: string; codes: string }> {
    if (!this.selectedResult) return [];
    const record = this.selectedResult.record;
    const selectedMfg = this.selectedResult.manufacturer;
    const result: Array<{ brand: string; codes: string }> = [];

    for (const mfg of this.MFG_LIST) {
      if (mfg === selectedMfg) continue;
      const val = (record[mfg] || '').trim();
      if (val && val !== '-') {
        result.push({ brand: mfg, codes: val.trim() });
      }
    }

    return result.sort((a, b) => a.brand.localeCompare(b.brand));
  }

  getSubstitutes(): string[] {
    if (!this.selectedResult) return [];
    const subs = (this.selectedResult.record.substitutes || '').trim();
    if (!subs) return [];
    return subs
      .split(/[\s,]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s && s !== '-');
  }

  searchSubstitute(sub: string) {
    this.keyName = sub;
    this.selectedResult = null;
    this.detailProducts = [];
    this.search();
  }

  addToCart(product: any) {
    this.utilService.addToCart({ itemID: product.itemID, qtyOrder: product.qtyOrder || 1 });
  }

  getProductImageUrl(product: any): string {
    return this.utilService.getImgBaseUrl() + (product.image || '');
  }

  incrementQty(product: any) {
    product.qtyOrder = (product.qtyOrder || 1) + 1;
  }

  decrementQty(product: any) {
    if ((product.qtyOrder || 1) > 1) {
      product.qtyOrder--;
    }
  }

  reset() {
    this.keyName = '';
    this.exactMatchOnly = false;
    this.hasSearched = false;
    this.searchResults = [];
    this.selectedResult = null;
    this.detailProducts = [];
  }

  onEnterKey(event: any) {
    if (event.key === 'Enter') {
      this.search();
    }
  }
}
