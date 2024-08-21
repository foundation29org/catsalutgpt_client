import { Injectable } from '@angular/core';
import 'rxjs/add/observable/of';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class DialogService {
  public constructor(public translate : TranslateService) {
  }
  confirm(message?: string): Promise<boolean> {
    /*const confirmation = window.confirm(message || 'Are you sure?');
    return Observable.of(confirmation);*/
    return new Promise((resolve, reject) => {
      swal({
        title: message,
        text: '',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Yes"),
        cancelButtonText: this.translate.instant("generics.No"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
      }).then(result => {
        if (result.value) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
}
