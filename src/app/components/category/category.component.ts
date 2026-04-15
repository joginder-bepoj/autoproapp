import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { IonicModule } from "@ionic/angular";
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
  imports: [IonicModule, FormsModule, CommonModule, BreadcrumbsComponent],
})
export class CategoryComponent implements OnInit {

  categoryData: any = {};
  makes: any = [];
  breadcrumb = [];

  selectedMake: any = {
    make: '',
    makeID: '',
    model: []
  };

  selectedModel: any = {
    modelName: '',
    modelID: '',
    years: []
  };

  selectedYear: any = {
    year: '',
    vehicleID: ''
  };

  vehicleSearchQuery: string = '';

  currentStep: number = 1;

  constructor(private apiService: ApiService, private router: Router, private utilService: UtilService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.fetchCategories();
    this.route.queryParams.subscribe((params: any) => {
      this.vehicleSearchQuery = params['search'] || '';
    });
  }

  fetchCategories() {
    this.utilService.showLoader();
    this.apiService.getCategoryList().subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        this.categoryData = res;
        if (this.vehicleSearchQuery) {
          const results = this.searchVehicle();
          console.log(results, 'result from the make')
          this.makes = results
        } else {
          this.makes = Object.values(res)
        }
      },
      error: (error) => {
        this.utilService.hideLoader();
        console.error('Error fetching categories:', error);
      }
    });
  }

  onMakeChange(selectedMake: any) {
    console.log(selectedMake)
    this.selectedModel = {
      modelName: '',
      modelID: '',
      years: []
    };

    this.selectedYear = {
      year: '',
      vehicleID: ''
    };

    if (selectedMake && this.categoryData[selectedMake.make]) {
      this.currentStep = 2;
      this.selectedMake = selectedMake;
      console.log(this.selectedMake)
    } else {
      this.currentStep = 1;
    }
  }

  onModelChange(selectedModel: any) {
    this.selectedYear = {
      year: '',
      vehicleID: ''
    };

    if (selectedModel && selectedModel.years) {
      this.currentStep = 3;
    } else {
      this.currentStep = 2;
    }
  }

  onSearch() {
    if (this.selectedMake && this.selectedModel && this.selectedYear) {
      this.router.navigateByUrl(`${this.normalizeString(this.selectedMake.make)}/${this.normalizeString(this.selectedModel.modelName)}/vehicle-details/${this.selectedYear.vehicleID}`);
    }
  }

  isSearchDisabled(): boolean {
    return !this.selectedMake.make || !this.selectedModel.modelName || !this.selectedYear.vehicleID;
  }

  normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\(.*?\)/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  searchVehicle() {
    const results: any[] = [];
    const query = this.vehicleSearchQuery.trim().toLowerCase();

    Object.values(this.categoryData).forEach((item: any) => {
      const makeName = item.make?.toLowerCase() || "";

      if (makeName.includes(query)) {
        results.push(item);
      } else {
        const matchedModels = (item.model || []).filter((model: any) =>
          model.modelName?.toLowerCase().includes(query)
        );

        if (matchedModels.length > 0) {
          results.push({
            ...item,
            model: matchedModels,
          });
        }
      }
    });

    return results;
  }

}
