import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonIcon, } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, listOutline
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api-service';
import { UtilService } from '../../services/util.service';


@Component({
  selector: 'app-dynamic-pages',
  templateUrl: './dynamic-pages.component.html',
  styleUrls: ['./dynamic-pages.component.scss'],
  standalone: true,
  imports: [NgFor, IonGrid, IonRow, IonCol, IonIcon, CommonModule],
})
export class DynamicPagesComponent implements OnInit {

  constructor(private utilService: UtilService, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    addIcons({ chevronForwardOutline, listOutline, });
  }
  ezPages: any[] = [];
  pageData: any[] = [];
  pageQuery: string = '';

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.pageQuery = params?.page.replaceAll('-', ' ');
      this.loadEzPages(this.pageQuery);
    });
  }

  loadEzPages(pageQuery: string) {
    this.utilService.showLoader();
    this.apiService.getEzPages().subscribe({
      next: (res: any) => {
        this.ezPages = res;
        this.pageData = this.ezPages.filter((page: any) => {
          return page?.Location?.toLowerCase().includes(pageQuery.toLowerCase())
        }).sort((a: any, b: any) => a?.['Sort Order'] - b?.['Sort Order']);
        console.log(this.pageData);
        this.utilService.hideLoader();
      },
      error: (err) => {
        this.utilService.hideLoader();
        console.error(err);
      }
    });
  }

  handlePageClick(page: any) {
    if (page['Page Content'] === "NissanBCMtoPinConverstionFragment") {
      this.router.navigate(['/nissan-bcm-to-pin']);
    } else {
      this.utilService.showToast('Page Content not found');
    }
  }

}
