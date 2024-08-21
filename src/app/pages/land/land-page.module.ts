import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ng2-validation';
import { LandPageRoutingModule } from "./land-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { AboutF29PageComponent } from "./about-f29/about-f29-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { SafePipe } from 'app/shared/services/safe.pipe';

import {MatCheckboxModule} from '@angular/material/checkbox';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    exports: [
        TranslateModule,
    ],
    imports: [
        CommonModule,
        LandPageRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule
    ],
    declarations: [
        AboutUsPageComponent,
        AboutF29PageComponent,
        UndiagnosedPageComponent,
        SafePipe
    ]
})
export class LandPageModule { }
