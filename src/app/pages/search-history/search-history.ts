import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { timeOutline, searchOutline, chevronForwardOutline, trashOutline, cogSharp } from 'ionicons/icons';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

@Component({
  selector: 'app-search-history',
  templateUrl: './search-history.html',
  styleUrls: ['./search-history.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, FooterComponent]
})
export class SearchHistoryPage implements OnInit, OnDestroy {

  user: any;
  history: any[] = [];
  isLoading: boolean = false;
  private userSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private utilService: UtilService
  ) {
    addIcons({ timeOutline, searchOutline, chevronForwardOutline, trashOutline });
  }

  ngOnInit() {

    this.apiService.getSearchHistory('3135363938').subscribe((res) => {
      console.log(res)

    }, err => {
      console.log(err)
    })
    console.log('i ma nasdnakld')
    // this.userSub = this.utilService.currentUser$.subscribe((user: any) => {
    //   this.user = user;
    //   if (user) {
    //     this.loadHistory();
    //   }
    // });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  // loadHistory() {

  //   this.isLoading = true;
  //   const userIdHex = this.utilService.strToHex(this.user.customerID);
  //   const timestamp = Date.now();

  //   this.apiService.getSearchHistory(userIdHex).subscribe({
  //     next: (res: any) => {
  //       this.isLoading = false;
  //       if (res) {
  //         if (typeof res === 'object' && !Array.isArray(res)) {
  //           this.history = Object.keys(res).map(key => ({
  //             id: key,
  //             ...res[key]
  //           })).reverse();
  //         } else if (Array.isArray(res)) {
  //           this.history = res.reverse();
  //         }
  //       }
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //       console.error('Error fetching search history:', err);
  //       this.utilService.showToast('Failed to load search history', 'danger');
  //     }
  //   });
  // }

  // formatDate(timestamp: any): string {
  //   if (!timestamp) return '';
  //   const date = new Date(Number(timestamp));
  //   return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // }

  clearHistory() {
    // This functionality isn't requested but would be a nice-to-have.
    // For now, I'll just leave it as a placeholder or skip if not needed.
  }
}
