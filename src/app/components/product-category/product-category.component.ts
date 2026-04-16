import { NgFor, CommonModule } from '@angular/common';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { DropDownsComponent } from '../../shared/drop-downs/drop-downs.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { Router } from '@angular/router';

interface CategoryStep {
  label: string;
  placeholder: string;
  options: any[];
  selectedValue: any;
}

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss'],
  standalone: true,
  imports: [NgFor, CommonModule, DropDownsComponent, BreadcrumbsComponent, IonButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductCategoryComponent implements OnInit {

  categories: any[] = [];
  activeSteps: CategoryStep[] = [];

  breadcrumb = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadInitialCategories();
  }

  loadInitialCategories() {
    this.apiService.getProductCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data.categories.subCategory || [];
        this.initializeSteps();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  initializeSteps() {
    this.activeSteps = [
      {
        label: 'Main Category',
        placeholder: 'Select Category',
        options: this.categories,
        selectedValue: null
      }
    ];
  }

  onStepChange(value: any, index: number) {
    this.activeSteps[index].selectedValue = value;
    this.activeSteps = this.activeSteps.slice(0, index + 1);
    if (value && value.subCategory && value.subCategory.length > 0) {
      this.activeSteps.push({
        label: 'Sub-Category',
        placeholder: 'Select Sub-Category',
        options: value.subCategory,
        selectedValue: null
      });
    }
  }

  isStepActive(index: number): boolean {
    return index === this.activeSteps.length - 1 || !!this.activeSteps[index].selectedValue;
  }

  isSelectionComplete(): boolean {
    if (this.activeSteps.length === 0) return false;
    const lastStep = this.activeSteps[this.activeSteps.length - 1];

    // Selection is complete if the last selected item has no more sub-categories
    return lastStep.selectedValue && (!lastStep.selectedValue.subCategory || lastStep.selectedValue.subCategory.length === 0);
  }

  onFindProducts() {
    const lastSelection = this.activeSteps[this.activeSteps.length - 1].selectedValue;
    if (lastSelection && lastSelection.id) {
      this.router.navigate(['product-list', lastSelection.id]);
    }
  }
}
