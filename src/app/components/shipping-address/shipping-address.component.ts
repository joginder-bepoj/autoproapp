import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, saveOutline, closeOutline, chevronForwardOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { AddAddressModalComponent } from '../add-address-modal/add-address-modal.component';

type CountryCode = 'usa' | 'canada' | string;

interface ShippingAddress {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressFirstLine?: string;
  addressSecondLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: CountryCode;
  phoneNumber?: string;
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
    FooterComponent,
    BreadcrumbsComponent
    ,AddAddressModalComponent
  ]
})
export class ShippingAddressComponent implements OnInit {
  addresses: ShippingAddress[] = [];
  selectedAddressId: string | number | null = null;
  showAddressModal = false;

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({ locationOutline, saveOutline, closeOutline, chevronForwardOutline });
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
        id: a?.id ?? a?.addressId ?? a?.addressID ?? a?.address_id ?? idx,
        firstName: a?.firstName ?? a?.firstname ?? a?.FirstName,
        lastName: a?.lastName ?? a?.lastname ?? a?.LastName,
        company: a?.company ?? a?.Company,
        addressFirstLine:
          a?.addressFirstLine ?? a?.address1 ?? a?.Address1 ?? a?.street ?? a?.Street,
        addressSecondLine:
          a?.addressSecondLine ?? a?.address2 ?? a?.Address2 ?? a?.suburb ?? a?.Suburb,
        city: a?.city ?? a?.City,
        state: a?.state ?? a?.stateCode ?? a?.State ?? a?.StateCode,
        postalCode: a?.postalCode ?? a?.zip ?? a?.Zip,
        country: a?.country ?? a?.countryCode ?? a?.Country ?? a?.CountryCode,
        phoneNumber: a?.phoneNumber ?? a?.phone ?? a?.PhoneNumber,
        isDefault: !!(a?.isDefault ?? a?.default ?? a?.is_default)
      }));
      this.selectedAddressId =
        (this.addresses.find((x) => x.isDefault)?.id ?? this.addresses[0]?.id ?? null);
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
    this.selectedAddressId = this.addresses[0]?.id ?? null;
  }

  cancel() {
    this.router.navigate(['/account-settings']);
  }

  trackByAddressId = (_: number, item: ShippingAddress) => item.id ?? item.addressFirstLine ?? _;

  getFullName(a: ShippingAddress): string {
    return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
  }

  selectAddress(a: ShippingAddress) {
    this.selectedAddressId = a.id ?? null;
  }

  addNewAddress() {
    this.showAddressModal = true;
  }

  editAddress(a: ShippingAddress) {
    const label = a.company || this.getFullName(a) || 'this address';
    this.utilService.showToast(`Edit ${label} coming soon`, 'primary');
  }

  onAddressSaved(data: any) {
    this.showAddressModal = false;
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

  onAddressCancel() {
    this.showAddressModal = false;
  }
}
