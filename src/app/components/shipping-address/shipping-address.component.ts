import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, saveOutline, closeOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

type CountryCode = 'usa' | 'canada' | string;

interface ShippingAddress {
  id?: string | number;
  company?: string;
  addressFirstLine?: string;
  addressSecondLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: CountryCode;
  isDefault?: boolean;
}

@Component({
  selector: 'app-shipping-address',
  templateUrl: './shipping-address.component.html',
  styleUrls: ['./shipping-address.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonButton,
    FooterComponent
  ]
})
export class ShippingAddressComponent implements OnInit {
  addresses: ShippingAddress[] = [];

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({ locationOutline, saveOutline, closeOutline });
  }

  ngOnInit(): void {
    const user = this.utilService.getUserProfile();
    if (user) {
      this.hydrateAddressesFromProfile(user);
      return;
    }

    this.utilService.showLoader();
    this.apiService.getCustomerProfile().subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;
        if (profile) {
          this.utilService.setUserProfile(profile);
          this.hydrateAddressesFromProfile(profile);
        }
        this.utilService.hideLoader();
      },
      error: () => {
        this.utilService.hideLoader();
      }
    });
  }

  private hydrateAddressesFromProfile(profile: any) {
    const list = profile?.addresses;
    if (Array.isArray(list) && list.length > 0) {
      this.addresses = list.map((a: any, idx: number) => ({
        id: a?.id ?? a?.addressId ?? idx,
        company: a?.company ?? a?.Company,
        addressFirstLine: a?.addressFirstLine ?? a?.address1 ?? a?.Address1,
        addressSecondLine: a?.addressSecondLine ?? a?.address2 ?? a?.Address2,
        city: a?.city ?? a?.City,
        state: a?.state ?? a?.State,
        postalCode: a?.postalCode ?? a?.zip ?? a?.Zip,
        country: a?.country ?? a?.Country,
        isDefault: !!(a?.isDefault ?? a?.default ?? a?.is_default)
      }));
      return;
    }

    // Fallback to single-address fields (used by current registration flow)
    const fallback: ShippingAddress = {
      company: profile?.company || '',
      addressFirstLine: profile?.addressFirstLine || '',
      addressSecondLine: profile?.addressSecondLine || '',
      city: profile?.city || '',
      state: profile?.state || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || 'usa',
      isDefault: true
    };

    const hasAny =
      !!fallback.company ||
      !!fallback.addressFirstLine ||
      !!fallback.addressSecondLine ||
      !!fallback.city ||
      !!fallback.state ||
      !!fallback.postalCode;

    this.addresses = hasAny ? [fallback] : [];
  }

  cancel() {
    this.router.navigate(['/account-settings']);
  }

  trackByAddressId = (_: number, item: ShippingAddress) => item.id ?? item.addressFirstLine ?? _;
}
