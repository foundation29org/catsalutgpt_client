import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { v4 as uuidv4 } from 'uuid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EventsService} from 'app/shared/services/events.service';
import { Injector } from '@angular/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import swal from 'sweetalert2';
declare let gtag: any;

@Component({
    selector: 'app-feedback-page',
    templateUrl: './feedback-page.component.html',
    styleUrls: ['./feedback-page.component.scss'],
    providers: [InsightsService]
})

export class FeedbackPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    email: string = '';
    showErrorForm: boolean = false;
    sending: boolean = false;
    terms2: boolean = false;
    @ViewChild('f') mainForm: NgForm;
    moreFunctLength: number = 0;
    freeTextLength: number = 0;
    formulario: FormGroup;

    constructor(private searchService: SearchService, public translate: TranslateService, private http: HttpClient, public toastr: ToastsManager, public activeModal: NgbActiveModal, private inj: Injector, public insightsService: InsightsService) {
        this._startTime = Date.now();
        if(sessionStorage.getItem('uuid')!=null){
            this.myuuid = sessionStorage.getItem('uuid');
        }else{
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
        

        this.formulario = new FormGroup({
            pregunta1: new FormControl('', Validators.required), // Definir los controles del formulario
            pregunta2: new FormControl('', Validators.required),
            moreFunct: new FormControl(''),
            freeText: new FormControl(''),
            terms2: new FormControl('')
          });
          this.moreFunctLength = this.formulario.get('moreFunct').value.length;
          this.freeTextLength = this.formulario.get('freeText').value.length;

          setTimeout(function () {
            //this.goTo('initpos');
        }.bind(this), 500);

    }

    onInput(event: Event, controlName: string): void {
        const inputElement = event.target as HTMLTextAreaElement;
        if (controlName === 'moreFunct') {
          this.moreFunctLength = inputElement.value.length;
        } else if (controlName === 'freeText') {
          this.freeTextLength = inputElement.value.length;
        }
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }

      goTo(url){
        document.getElementById(url).scrollIntoView(true);
      }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if(!savedEvent){
            this.eventList.push({name:category});
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }
  
      sendFeedback(){
        if (this.formulario.valid) {
          this.sending = true;
          var value = { value: this.formulario.value, myuuid: this.myuuid }
          this.subscription.add( this.http.post(environment.serverapi+'/api/generalfeedback/', value)
          .subscribe( (res : any) => {
            this.sending = false;
            this.toastr.success('Gracias por tu valoración.', 'Enviado');
            // Limpie el formulario después de enviar
            this.formulario.reset();
            this.freeTextLength = 0;
            this.moreFunctLength = 0;
            this.lauchEvent('Send email');
            this.activeModal.close();
            //broadcast event
            var eventsLang = this.inj.get(EventsService);
            eventsLang.broadcast('sentFeedback', 'true');
            localStorage.setItem('sentFeedback', 'sent')
            localStorage.setItem('feedbackTimestamp', Date.now().toString());
           }, (err) => {
            this.insightsService.trackException(err);
             console.log(err);
             this.sending = false;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        } else {
            swal({
                type: 'error',
                html: 'Por favor, valore la calidad pulsando en las estrellas.',
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
        } 
      }

    changeTerm($event){
        if ($event.checked) {
            localStorage.setItem('showFeedback', 'true')
        } else {
            localStorage.setItem('showFeedback', 'false')
        }
    }

    showOptions() {
        this.terms2 = !this.terms2;
        if (this.terms2) {
            localStorage.setItem('showFeedback', 'true')
        } else {
            localStorage.setItem('showFeedback', 'false')
        }
    }

}
