import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonInput, IonSelect, IonSelectOption, IonIcon } from '@ionic/angular/standalone';
import { ApiService } from 'src/app/services/api-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UtilService } from 'src/app/services/util.service';
import { closeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-add-address-modal',
  templateUrl: './add-address-modal.component.html',
  styleUrls: ['./add-address-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonSelect, IonSelectOption, IonButton, IonIcon]
})
export class AddAddressModalComponent implements OnInit {
  @Output() saved = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  nickname = '';
  firstName = '';
  lastName = '';
  company = '';
  addressFirstLine = '';
  addressSecondLine = '';
  country = '';
  state = '';
  city = '';
  postalCode = '';
  phoneNumber = '';
  isDefault = false;

  isSaving = false;
  zones: any[] = []; 
  countries: { name: string; code: string; iso3?: string; raw?: any }[] = [];
  filteredStates: { name: string; code: string }[] = [];

  constructor(private apiService: ApiService, private utilService: UtilService, private http: HttpClient) {
    addIcons({ closeOutline });
  }

  ngOnInit(): void {
    this.loadZones();
  }

  private loadZones() {
    this.utilService.showLoader();
    this.apiService.getZones().subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        const data = res?.data ?? res;
        this.zones = Array.isArray(data?.geoZone ? data.geoZone : data) ? (data.geoZone ?? data) : [];
        // build countries list from zones
        this.countries = this.zones.map((z: any) => ({
          name: z.name || z.country || '',
          code: (z.isoCode2 || z.iso2 || z.code || '').toString(),
          iso3: z.isoCode3 || z.iso3,
          raw: z
        }));
        // if we have a default country preference, try to set it
        if (!this.country && this.countries.length > 0) {
          const us = this.countries.find(c => c.code.toLowerCase() === 'us' || c.name.toLowerCase().includes('united states'));
          this.country = us ? us.code : this.countries[0].code;
        }
        this.updateFilteredStates();
      },
      error: () => {
        this.utilService.hideLoader();
        this.zones = [];
        this.updateFilteredStates();
      }
    });
  }

  private updateFilteredStates() {
    const countryKey = (this.country || '').toString().toLowerCase();
    if (!countryKey) {
      this.filteredStates = [];
      return;
    }
    // find matching country entry
    const matched = this.zones.find((z: any) => {
      const code = (z.isoCode2 || z.iso2 || '').toString().toLowerCase();
      const name = (z.name || '').toString().toLowerCase();
      return code === countryKey || name === countryKey || name.includes(countryKey) || code.includes(countryKey);
    });

    if (!matched) {
      this.filteredStates = [];
      return;
    }

    const zonesArray = Array.isArray(matched.zones) ? matched.zones : [];
    this.filteredStates = zonesArray.map((s: any) => ({
      name: s.name || s.zoneName || s.state || '',
      code: s.code || s.zoneCode || s.stateCode || ''
    }));
  }

submit() {
  if (!this.addressFirstLine || !this.city || !this.postalCode || !this.country) {
    this.utilService.showToast('Please fill required address fields.', 'warning');
    return;
  }

  const body: any = {
    firstName: this.firstName,
    lastName: this.lastName,
    company: this.company,
    street: this.addressFirstLine,
    city: this.city,
    state: this.state,
    country: this.country,
    postalCode: this.postalCode,
    phoneNumber: this.phoneNumber
  };

  this.isSaving = true;
  this.utilService.showLoader();

  this.apiService.addCustomerAddress(body).subscribe({
    next: (res: any) => {
      this.utilService.hideLoader();
      this.isSaving = false;

      if (res.result?.toLowerCase() !== 'ok') {
        this.utilService.showToast(
          res?.errors?.message || 'Failed to save address',
          'danger'
        );
        return;
      }

      const data = res?.data ?? res;

      this.utilService.showToast('Address saved.', 'success');

      // Refresh customer profile
      this.apiService.getCustomerProfile().subscribe({
        next: (profileRes: any) => {
          const profileData = profileRes?.data ?? profileRes;
          if (profileData) {
            this.utilService.setUserProfile(profileData);
          }
        },
        error: () => {
          // Ignore profile refresh errors
        }
      });

      // Reset form
      this.nickname = '';
      this.firstName = '';
      this.lastName = '';
      this.company = '';
      this.addressFirstLine = '';
      this.addressSecondLine = '';
      this.city = '';
      this.state = '';
      this.postalCode = '';
      this.country = this.countries?.length ? this.countries[0].code : '';
      this.phoneNumber = '';
      this.isDefault = false;

      this.saved.emit(data);
    },

    error: (err: any) => {
      this.utilService.hideLoader();
      this.isSaving = false;

      this.utilService.showToast(
        this.utilService.parseErrorMessage(err) || 'Failed to save address',
        'danger'
      );
    }
  });
}

  onCancel() {
    this.cancel.emit();
  }

  onCountryChange() {
    this.updateFilteredStates();
  }
}
