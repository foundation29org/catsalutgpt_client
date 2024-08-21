import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LangService } from 'app/shared/services/lang.service';
import { EventsService } from 'app/shared/services/events.service';
import { Injector } from '@angular/core';

declare let gtag: any;

@Component({
  selector: 'app-navbar-dx29',
  templateUrl: './navbar-dx29.component.html',
  styleUrls: ['./navbar-dx29.component.scss'],
  providers: [LangService]
})

export class NavbarD29Component implements OnDestroy {
  currentLang = 'en';
  langs: any;
  toggleClass = 'ft-maximize';
  placement = "bottom-right";
  public isCollapsed = true;

  isHomePage: boolean = false;
  isAboutPage: boolean = false;
  isF29AboutPage: boolean = false;
  _startTime: any;
  private subscription: Subscription = new Subscription();
  isMenuExpanded = false;

  constructor(public translate: TranslateService, private langService: LangService, private router: Router, private inj: Injector) {
    this.loadLanguages();
    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isAboutPage = false;
          this.isF29AboutPage = false;
        } else if (tempUrl.indexOf('/sobrecatsalutgpt') != -1) {
          this.isHomePage = false;
          this.isAboutPage = true;
          this.isF29AboutPage = false;
        }else if (tempUrl.indexOf('/sobref29') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isF29AboutPage = true;
        } else {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isF29AboutPage = false;
        }
      }
    );
    this._startTime = Date.now();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadLanguages() {
    this.subscription.add(this.langService.getLangs()
      .subscribe((res: any) => {
        this.langs = res;
        if (sessionStorage.getItem('lang')) {
          this.translate.use(sessionStorage.getItem('lang'));
          this.searchLangName(sessionStorage.getItem('lang'));
        } else {
          const browserLang: string = this.translate.getBrowserLang();
          var foundlang = false;
          for (let lang of this.langs) {
            if (browserLang.match(lang.code)) {
              this.translate.use(lang.code);
              foundlang = true;
              sessionStorage.setItem('lang', lang.code);
              this.searchLangName(lang.name);
            }
          }
          if (!foundlang) {
            sessionStorage.setItem('lang', this.translate.store.currentLang);
          }
        }

      }, (err) => {
        console.log(err);
      }));
  }

  searchLangName(code: string) {
    for (let lang of this.langs) {
      var actualLang = sessionStorage.getItem('lang');
      if (actualLang == lang.code) {
        this.currentLang = lang.code;
      }
    }
  }

  ChangeLanguage(language: string) {
    this.translate.use(language);
    sessionStorage.setItem('lang', language);
    this.searchLangName(language);
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('changelang', language);
  }

  ToggleClass() {
    if (this.toggleClass === "ft-maximize") {
      this.toggleClass = "ft-minimize";
    } else {
      this.toggleClass = "ft-maximize";
    }
  }

  lauchEvent(category) {
    var secs = this.getElapsedSeconds();
    gtag('event', category, { 'myuuid': sessionStorage.getItem('uuid'), 'event_label': secs });
  }

  getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
  };

  goBackEvent() {
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('backEvent', true);
  }

  toggleMenu() {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu() {
    this.isMenuExpanded = false;
  }

   @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.navbar-collapse');
    const clickedToggleButton = target.closest('.navbar-toggler');

    if (!clickedInsideMenu && !clickedToggleButton) {
      this.closeMenu();
    } else if (clickedInsideMenu && !clickedToggleButton) {
      this.closeMenu();
    }
  }

}
