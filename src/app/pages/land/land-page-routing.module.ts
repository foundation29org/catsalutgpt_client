import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { AboutF29PageComponent } from "./about-f29/about-f29-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: UndiagnosedPageComponent,
        data: {
          title: 'CatSalutGPT'
        },
      },
      {
        path: 'sobrecatsalutgpt',
        component: AboutUsPageComponent,
        data: {
          title: 'menu.About us'
        }
      },
      {
        path: 'sobref29',
        component: AboutF29PageComponent,
        data: {
          title: 'menu.About f29'
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
