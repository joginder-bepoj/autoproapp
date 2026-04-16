import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-nissan-bcm-to-pin',
  templateUrl: './nissan-bcm-to-pin.component.html',
  styleUrls: ['./nissan-bcm-to-pin.component.scss'],
})
export class NissanBcmToPinComponent implements OnInit {

  constructor(private apiService: ApiService, private utilService: UtilService) { }

  user: any;

  ngOnInit() {
    this.utilService.currentUserSubject.subscribe((user: any) => {
      this.user = user;
      if (user) {
        this.checkNissan5BcmLimit();
      }
    });
  }

  ngOnDestroy() {
    this.utilService.currentUserSubject.unsubscribe();
  }

  async checkNissan5BcmLimit() {
    this.utilService.showLoader();
    this.apiService.checkNissan5BcmLimit(this.utilService.strToHex(this.user?.customerID)).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        console.log(res);
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        console.error(err);
      }
    });
  }

}
