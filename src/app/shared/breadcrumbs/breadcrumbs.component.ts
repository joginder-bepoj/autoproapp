import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, chevronForwardOutline } from 'ionicons/icons';

interface Breadcrumb {
  label: string;
  url: string | null;
  query?: any;
}

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  @Input() breadcrumb: Breadcrumb[] = [];
  isHome: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    addIcons({ homeOutline, chevronForwardOutline });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(item: Breadcrumb) {
    if (!item.url) return;

    if (item.query) {
      this.router.navigate([item.url], { queryParams: item.query });
    } else {
      this.router.navigate([item.url]);
    }
  }

}

