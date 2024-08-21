import { Component, ViewContainerRef, OnInit, NgZone } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap'
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { LangService } from 'app/shared/services/lang.service';
import swal from 'sweetalert2';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [LangService]
})
export class AppComponent implements OnInit{
  tituloEvent: string = '';
  private startY: number = 0;
  private startX: number = 0;
  private scrollPosition: number = 0;
  private ticking: boolean = false;
  private isOpenSwal: boolean = false;
    //Set toastr container ref configuration for toastr positioning on screen
    constructor(public toastr: ToastsManager, vRef: ViewContainerRef, private router: Router, private activatedRoute: ActivatedRoute, private titleService: Title, public translate: TranslateService, private ngZone: NgZone) {
        this.toastr.setRootViewContainerRef(vRef);

        this.translate.use('es');

    }

     ngOnInit(){
      //every time you change your route
      this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map((route) => {
        while (route.firstChild) route = route.firstChild;
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {
        this.titleService.setTitle(this.translate.instant(event['title']));
        //para los anchor de la misma páginano hacer scroll hasta arriba
        if(this.tituloEvent != event['title']){
          window.scrollTo(0, 0)
        }
        this.tituloEvent = event['title'];
      });

      window.addEventListener('scroll', this.onScroll.bind(this), true);
      document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });

     }

     private onScroll() {
      this.scrollPosition = window.pageYOffset;
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.ticking = false;
        });
        this.ticking = true;
      }
    }
  
    private onTouchStart(e: TouchEvent) {
      this.startY = e.touches[0].pageY;
      this.startX = e.touches[0].pageX;
    }
  
    private onTouchMove(e: TouchEvent) {
      const y = e.touches[0].pageY;
      const x = e.touches[0].pageX;
      
      // Calcula la distancia y el ángulo del gesto
      const deltaY = y - this.startY;
      const deltaX = x - this.startX;
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
      
      // Si el gesto es principalmente vertical (ángulo > 60°) y hacia abajo
      if (angle > 60 && deltaY > 0 && this.scrollPosition <= 0) {
        e.preventDefault();
        this.ngZone.run(() => {
          this.showReloadConfirmation();
        });
      }
    }
  
    private showReloadConfirmation() {
      if (this.isOpenSwal) {
        return;
      }
      this.isOpenSwal = true;
      swal({
        title: this.translate.instant("generics.Reload the page"),
        text: this.translate.instant("generics.Unsaved changes will be lost"),
        type: 'question',
        showCancelButton: true,
        confirmButtonColor: '#B30000',
        cancelButtonColor: '#B0B6BB',
        confirmButtonText: this.translate.instant("generics.Yes, reload"),
        cancelButtonText: this.translate.instant("generics.Cancel")
      }).then((result) => {
        if (result.value) {
          window.location.reload();
        }
        this.isOpenSwal = false;
      });

    }
}
