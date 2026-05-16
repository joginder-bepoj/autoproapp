import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonIcon, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, listOutline, arrowBackOutline, downloadOutline, openOutline, globeOutline
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api-service';
import { UtilService } from '../../services/util.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';


@Component({
  selector: 'app-dynamic-pages',
  templateUrl: './dynamic-pages.component.html',
  styleUrls: ['./dynamic-pages.component.scss'],
  standalone: true,
  imports: [IonContent, NgFor, IonGrid, IonRow, IonCol, IonIcon, CommonModule, BreadcrumbsComponent, FooterComponent],
})
export class DynamicPagesComponent implements OnInit {

  constructor(
    private utilService: UtilService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    addIcons({ chevronForwardOutline, listOutline, arrowBackOutline, downloadOutline, openOutline, globeOutline });
  }
  ezPages: any[] = [];
  pageData: any[] = [];
  pageQuery: string = '';
  // dynamicHtml: any = ""
  // pdfUrl: any = ""
  // videoUrl: any =   ""
  // externalUrl: any = ""
  // rawPdfUrl: string = ""
  // currentView: string = ""
  breadcrumbs: any[] = [];
  // isLandingPage: boolean = false;
  // useViewer: boolean = true;
  // isPdfLoading: boolean = false;
  // isChangingPage: boolean = false;

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.pageQuery = params?.page?.replace(/-/g, ' ');
      console.log("pageQuery", this.pageQuery);
      if (this.pageQuery === "Articles Tutorials") {
        this.pageQuery = "Articles & Tutorials";
      }
      if (this.utilService.getEzPages()?.length > 0) {
        this.ezPages = this.utilService.getEzPages();
        this.filterEzPages();
      } else {
        this.loadEzPages();
      }
    });
  }

  loadEzPages() {
    this.utilService.showLoader();
    this.apiService.getEzPages().subscribe({
      next: (res: any) => {
        this.ezPages = res;
        this.utilService.hideLoader();
        this.utilService.setEzPages(res);
        this.filterEzPages();
      },
      error: (err) => {
        this.utilService.hideLoader();
        console.error(err);
      }
    });
  }

  filterEzPages() {
    if (!this.pageQuery) return;
    console.log("pageQuery", this.pageQuery);
    this.pageData = this.ezPages.filter((page: any) => {
      return page && page.Location && page.Location.toLowerCase().includes(this.pageQuery.toLowerCase());
    }).sort((a: any, b: any) => (a?.['Sort Order'] || 0) - (b?.['Sort Order'] || 0));
    console.log("pageData", this.pageData);
  }

  handlePageClick(page: any) {
    if (!page) return;
    if (page['Page Content'] === "NissanBCMtoPinConverstionFragment") {
      this.router.navigate(['/nissan-bcm-to-pin']);

    } else if (page['Page Content'] === "Nissan20DigitBCMPINConversionFragment") {
      this.router.navigate(['/nissan-bcm-to-pin-20-digit']);

    } else if (page['Page_Type'] === "Link") {
      const url = page['Page Content'];
      window.open(url, '_blank');
    } else if (page['Page_Type'] === "HTML" || page['Page_Type'] === "PDF" || page['Page_Type'] === "Video") {
      const pName = (page['Page Name'] || '').replace(/ /g, '-');
      const paramPage = (this.pageQuery || '').replace(/ /g, '-');

      this.router.navigate(['/view', paramPage, pName]);
    } else {
      this.utilService.showToast('Coming soon', 'warning');
    }
  }

  // openPageContent(page: any) {
  //   if (page['Page_Type'] === "HTML") {
  //     this.dynamicHtml = page['Page Content'];

  //   } else if (page['Page_Type'] === "PDF") {
  //     this.isChangingPage = true; // Toggle to force DOM removal
  //     this.isPdfLoading = true;
  //     this.cdr.detectChanges(); // Sync state with view immediately

  //     const pdfUrl = page['Page Content'];
  //     this.rawPdfUrl = pdfUrl;

  //     // Only cache-bust the viewer shell, not the PDF URL itself.
  //     // Modifying the PDF URL can break signed technical links (Firebase/S3).
  //     const timestamp = new Date().getTime();
  //     const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true&t=${timestamp}`;

  //     this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  //     this.currentView = 'pdf';

  //     // Re-inject the iframe into the DOM after a short delay
  //     setTimeout(() => {
  //       this.isChangingPage = false;
  //       this.cdr.detectChanges();
  //     }, 50);

  //   } else if (page['Page_Type'] === "Video") {
  //     const videoCode = page['Page Content'];
  //     this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
  //       `https://www.youtube.com/embed/${videoCode}`
  //     );
  //     this.currentView = 'video';

  //   } else {
  //     this.utilService.showToast('Page Content not found');
  //   }
  // }

  // onIframeLoad() {
  //   // Delay slightly to ensure UI stability and prevent NG0100
  //   setTimeout(() => {
  //     this.isPdfLoading = false;
  //     this.cdr.detectChanges();
  //   }, 150);
  // }

  // showDynamicPage(page: any) {
  //   this.router.navigate(['/dynamic-pages', page['Page Name'].replace(/ /g, '-')]);
  // }

  // goBack() {
  //   const paramPage = this.pageQuery.replace(/ /g, '-');
  //   this.router.navigate(['/pages', paramPage]);
  // }

  // clearPageContent() {
  //   this.dynamicHtml = "";
  //   this.pdfUrl = "";
  //   this.videoUrl = "";
  //   this.rawPdfUrl = "";
  //   this.currentView = "";
  //   this.isPdfLoading = false;
  //   this.isChangingPage = false;
  // }

}
