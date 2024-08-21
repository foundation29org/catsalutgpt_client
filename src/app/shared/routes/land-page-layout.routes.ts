import { Routes } from '@angular/router';

//Route for content layout without sidebar, navbar and footer for pages like Login, Registration etc...

export const Land_Pages_ROUTES: Routes = [
     {
        path: '',
        loadChildren: './pages/land/land-page.module#LandPageModule'
    }
];
