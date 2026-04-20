import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, listOutline, arrowBackOutline, downloadOutline
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api-service';
import { UtilService } from '../../services/util.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-dynamic-pages',
  templateUrl: './dynamic-pages.component.html',
  styleUrls: ['./dynamic-pages.component.scss'],
  standalone: true,
  imports: [IonButton, NgFor, IonGrid, IonRow, IonCol, IonIcon, CommonModule, BreadcrumbsComponent],
})
export class DynamicPagesComponent implements OnInit {

  constructor(private utilService: UtilService, private apiService: ApiService, private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) {
    addIcons({ chevronForwardOutline, listOutline, arrowBackOutline, downloadOutline });
  }
  ezPages: any[] = [];
  pageData: any[] = [];
  pageQuery: string = '';
  dynamicHtml: any = ""
  pdfUrl: any = ""
  videoUrl: any = ""
  rawPdfUrl: string = ""
  currentView: string = ""
  breadcrumbs: any[] = [];

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

    } else if (page['Page Content'] === "Nissan20DigitBCMPINConversionFragment") {
      this.router.navigate(['/nissan-bcm-to-pin-20-digit']);

    } else if (page['Page_Type'] === "HTML") {
      this.dynamicHtml = page['Page Content'];

    } else if (page['Page_Type'] === "PDF") {

      const pdfUrl = page['Page Content'];
      this.rawPdfUrl = pdfUrl;
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
      this.currentView = 'pdf';

    } else if (page['Page_Type'] === "Video") {

      const videoCode = page['Page Content'];
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoCode}`
      );
      this.currentView = 'video';

    } else {
      this.utilService.showToast('Page Content not found');
    }
  }

  showDynamicPage(page: any) {
    this.router.navigate(['/dynamic-pages', page['Page Name'].replaceAll(' ', '-')]);
  }

  goBack() {
    this.dynamicHtml = "";
    this.pdfUrl = "";
    this.videoUrl = "";
    this.rawPdfUrl = "";
    this.currentView = "";
  }

}
