import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandPageLayoutComponent }  from "./land-page-layout.component";
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
import { NavbarD29Component } from 'app/shared/navbar-dx29/navbar-dx29.component';
import { FooterComponent } from 'app/shared/footer/footer.component';
import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
    exports: [
        CommonModule,
        NavbarD29Component,
        NgbModule,
        TranslateModule,
        FooterComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        NgbModule,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule
    ],
    declarations: [
        LandPageLayoutComponent,
        FeedbackPageComponent,
        NavbarD29Component,
        FooterComponent
    ],
    entryComponents:[FeedbackPageComponent]
})
export class CustomModule { }
