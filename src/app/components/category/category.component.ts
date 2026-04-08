import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { IonicModule } from "@ionic/angular";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from 'src/app/shared/components/breadcrumbs/breadcrumbs.component';
import { Router } from '@angular/router';

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

  currentStep: number = 1;

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.apiService.getCategoryList().subscribe({
      next: (res: any) => {
        this.categoryData = res;
        this.makes = Object.values(res)
        console.log(this.makes)
      },
      error: (error) => {
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
    console.log(selectedModel)
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
      this.router.navigateByUrl(`/vehicle-details/${this.selectedYear.vehicleID}`);
    }
  }

  isSearchDisabled(): boolean {
    return !this.selectedMake || !this.selectedModel || !this.selectedYear;
  }

}
