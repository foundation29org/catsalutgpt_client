
import * as $ from 'jquery';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from "./shared/shared.module";
import { CustomModule } from "./layouts/land-page/custom.module";
import { ToastModule, ToastOptions } from 'ng2-toastr/ng2-toastr';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';

import { CustomOption } from "./shared/configs/toastr/custom-option";
import { DatePipe } from '@angular/common';
import { DateService } from 'app/shared/services/date.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { EventsService} from 'app/shared/services/events.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { Data} from 'app/shared/services/data.service';
import { environment } from 'environments/environment';
import { AuthInterceptor } from './shared/auth/auth.interceptor';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, environment.serverapi+'/assets/i18n/', '.json');
    //return new TranslateHttpLoader(http, './assets/i18n/', '.json');
  }

@NgModule({
    declarations: [
        AppComponent,
        SearchFilterPipe
    ],
    imports: [
        BrowserAnimationsModule,
        AppRoutingModule,
        SharedModule,
        CustomModule,
        HttpClientModule,
        ToastModule.forRoot(),
        NgbModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
              }
        })

    ],
    providers: [
        {
            provide : HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi   : true
        },
        { provide: ToastOptions, useClass: CustomOption },
        DatePipe,
        DateService,
        SearchFilterPipe,
        SortService,
        SearchService,
        EventsService,
        DialogService,
        Data
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
