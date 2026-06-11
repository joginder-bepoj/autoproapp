import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    CommonModule,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class CategoryComponent implements OnInit {

  makes: any[] = [];
  allMakes: any[] = [];

  models: any[] = [];
  years: any[] = [];

  breadcrumb = [];

  selectedMake: any = {};
  selectedModel: any = {};
  selectedYear: any = {};

  vehicleSearchQuery: string = '';

  currentStep: number = 1;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private utilService: UtilService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      this.vehicleSearchQuery = params['search'] || '';
      this.getVehicleMakes();
    });
  }

  getVehicleMakes() {
    this.utilService.showLoader();

    this.apiService.getVehicleMake().subscribe({
      next: (res: any) => {

        this.utilService.hideLoader();
        this.selectedMake = {};
        this.selectedModel = {};
        this.selectedYear = {};
        this.currentStep = 1;
        const makes = Array.isArray(res?.[0])
          ? res[0]
          : Object.values(res?.[0] || {});

        this.allMakes = [...makes];

        if (this.vehicleSearchQuery?.trim()) {
          this.makes = this.searchVehicle();
        } else {
          this.makes = [...this.allMakes];
        }

        console.log('Makes:', this.makes);
      },
      error: (error) => {
        this.utilService.hideLoader();
        console.error('Error fetching vehicle makes:', error);
      },
    });
  }

  onMakeChange(selectedMake: any) {

    this.selectedMake = selectedMake;

    // Reset lower levels
    this.selectedModel = {};
    this.selectedYear = {};

    this.models = [];
    this.years = [];

    this.currentStep = 2;

    if (!selectedMake?.id) {
      return;
    }

    this.utilService.showLoader();

    this.apiService.getVehicleModel(selectedMake.id).subscribe({
      next: (res: any) => {

        this.utilService.hideLoader();

        this.models = Array.isArray(res?.[0])
          ? res[0]
          : Object.values(res?.[0] || {});

        console.log('Models:', this.models);
      },
      error: (error) => {
        this.utilService.hideLoader();
        console.error('Error fetching vehicle models:', error);
      },
    });
  }

  onModelChange(selectedModel: any) {

    this.selectedModel = selectedModel;

    // Reset year
    this.selectedYear = {};
    this.years = [];

    this.currentStep = 3;

    if (!selectedModel?.id) {
      return;
    }

    this.utilService.showLoader();

    this.apiService.getVehicleYears(selectedModel.id).subscribe({
      next: (res: any) => {

        this.utilService.hideLoader();

        this.years = Array.isArray(res?.[0])
          ? res[0]
          : Object.values(res?.[0] || {});

        console.log('Years:', this.years);
      },
      error: (error) => {
        this.utilService.hideLoader();
        console.error('Error fetching vehicle years:', error);
      },
    });
  }

  onSearch() {

    if (this.isSearchDisabled()) {
      return;
    }

    this.router.navigateByUrl(
      `${this.normalizeString(this.selectedMake.name)}/` +
      `${this.normalizeString(this.selectedModel.name)}/` +
      `vehicle-details/${this.selectedYear.id}`
    );
  }

  isSearchDisabled(): boolean {
    return (
      !this.selectedMake?.id ||
      !this.selectedModel?.id ||
      !this.selectedYear?.id
    );
  }

  normalizeString(str: string): string {
    return str
      ?.toLowerCase()
      ?.replace(/\s+/g, '-')
      ?.replace(/\(.*?\)/g, '')
      ?.replace(/-+/g, '-')
      ?.replace(/^-|-$/g, '') || '';
  }

  searchVehicle() {

    const query = this.vehicleSearchQuery.trim().toLowerCase();

    if (!query) {
      return [...this.allMakes];
    }

    return this.allMakes.filter((make: any) =>
      make?.name?.toLowerCase().includes(query)
    );
  }
}