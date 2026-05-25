import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { timeOutline, searchOutline, chevronForwardOutline, trashOutline } from 'ionicons/icons';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-search-history',
  templateUrl: './search-history.html',
  styleUrls: ['./search-history.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, FooterComponent, BreadcrumbsComponent, RouterLink]
})
export class SearchHistoryPage implements OnInit, OnDestroy {

  user: any;
  history: any[] = [];
  isLoading: boolean = false;
  private userSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({ timeOutline, searchOutline, chevronForwardOutline, trashOutline });
  }

  ngOnInit() {
    this.userSub = this.utilService.currentUser$.subscribe((user: any) => {
      if (user?.customerID) {
        this.user = user;
        this.loadHistory(user.customerID);
      }
    });
  }

  loadHistory(userIdHex: string) {
    this.utilService.showLoader()
    this.apiService.vehicleSearchHistory(userIdHex).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        if (res) {
          this.history = Object.values(res).sort((a: any, b: any) => b.time - a.time);
        } else {
          this.history = [];
        }
      },
      error: (err) => {
        this.utilService.hideLoader();
        console.error('Error fetching search history:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  navigateToVehicle(item: any) {
    if (item && item.id && item.vehicleName) {
      let vehicleName = item.vehicleName.toLowerCase().split(' ');
      if (vehicleName.length == 2) {
        this.router.navigate(['/' + vehicleName[0], vehicleName[1], 'vehicle-details', item.id], { queryParams: { from: 'history' } });
      } else {
        this.router.navigate(['/vehicle-details', item.id], { queryParams: { from: 'history' } });
      }
    }
  }

}
