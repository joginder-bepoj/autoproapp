import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { IonGrid, IonRow, IonCol, IonIcon, IonContent, IonButton, IonSpinner } from "@ionic/angular/standalone";
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, chevronForwardOutline, listOutline, globeOutline, documentTextOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-viewer',
  templateUrl: './content-viewer.component.html',
  styleUrls: ['./content-viewer.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, IonButton]
})
export class ContentViewerComponent implements OnInit, OnDestroy {
  pageQuery: string = '';
  categoryQuery: string = '';
  categoryLabel: string = '';
  selectedPage: any = null;

  routeSubscription!: Subscription;
  dynamicHtml: any = "";
  pdfUrl: SafeResourceUrl | null = null;
  videoUrl: SafeResourceUrl | null = null;
  rawPdfUrl: string = "";
  isPdfLoading: boolean = false;
  showFallbackHelp: boolean = false;
  fallbackTimer: any;
  breadcrumbs: any[] = [];
  pageData: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private utilService: UtilService,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    addIcons({ arrowBackOutline, downloadOutline, chevronForwardOutline, listOutline, globeOutline, documentTextOutline });
  }

  ngOnInit() {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.clearPageContent();

      this.categoryQuery = params.get('page') || '';
      this.pageQuery = (params.get('type') || '').replace(/-/g, ' ');
      this.categoryLabel = this.categoryQuery.replace(/-/g, ' ');

      const pages = this.utilService.getEzPages();

      if (pages?.length > 0) {
        this.filterPage();
      } else {
        this.loadEzPages();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPageContent();
    this.routeSubscription?.unsubscribe();
  }

  loadEzPages() {
    this.utilService.showLoader();
    this.apiService.getEzPages().subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        this.utilService.setEzPages(res);
        this.filterPage();
      },
      error: (err) => {
        this.utilService.hideLoader();
        console.error(err);
      }
    });
  }

  filterPage() {
    const pages = this.utilService.getEzPages();

    const selectedPage = pages?.find((p: any) =>
      p?.['Page Name'] &&
      p['Page Name'].replace(/ /g, '-').toLowerCase() ===
      this.pageQuery.replace(/ /g, '-').toLowerCase()
    );

    if (!selectedPage) {
      console.warn('Page NOT FOUND:', this.pageQuery);
      this.dynamicHtml = "<h3 style='text-align:center'>Content not found</h3>";
      return;
    }

    this.selectedPage = selectedPage;
    this.openPageContent(selectedPage);
    this.setupBreadcrumbs();
  }

  setupBreadcrumbs() {
    this.breadcrumbs = [
      { label: 'Home', link: '/home' },
      { label: this.categoryQuery.replace(/-/g, ' '), link: `/pages/${this.categoryQuery}` },
      { label: this.pageQuery, active: true }
    ];
  }

  openPageContent(page: any) {
    this.clearPageContent();

    if (page['Page_Type'] === "HTML") {
      this.dynamicHtml = this.sanitizer.bypassSecurityTrustHtml(page['Page Content']);

    } else if (page['Page_Type'] === "PDF") {
      const pdfUrl = page['Page Content'];
      this.rawPdfUrl = pdfUrl;

      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

      this.isPdfLoading = true;
      this.showFallbackHelp = false;
      this.pdfUrl = null;

      // Set fallback timer - if loading takes too long (> 4 seconds), show manual open prompt
      this.fallbackTimer = setTimeout(() => {
        if (this.isPdfLoading) {
          this.showFallbackHelp = true;
          this.cdr.detectChanges();
        }
      }, 4000);

      setTimeout(() => {
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
        this.cdr.detectChanges();
      });
    } else if (page['Page_Type'] === "Video") {
      const videoCode = page['Page Content'];
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoCode}`
      );

    } else {
      this.utilService.showToast('Page Content type not supported');
    }
  }

  onIframeLoad() {
    clearTimeout(this.fallbackTimer);
    setTimeout(() => {
      this.isPdfLoading = false;
      this.showFallbackHelp = false;
      this.cdr.detectChanges();
    }, 150);
  }

  openExternal() {
    window.open(this.rawPdfUrl, '_blank');
  }

  clearPageContent() {
    this.dynamicHtml = "";
    this.pdfUrl = null;
    this.videoUrl = null;
    this.rawPdfUrl = "";
    this.isPdfLoading = false;
    this.showFallbackHelp = false;
    clearTimeout(this.fallbackTimer);
  }

  goBack() {
    this.router.navigate(['/pages', this.categoryQuery]);
  }

  handlePageClick(page: any) {
    // In case there are related pages in the future
    const pName = (page['Page Name'] || '').replace(/ /g, '-');
    this.router.navigate(['/view', this.categoryQuery, pName]);
  }

}
