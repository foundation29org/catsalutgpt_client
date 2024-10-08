import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { Subscription } from 'rxjs/Subscription';
import { EventsService } from 'app/shared/services/events.service';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { v4 as uuidv4 } from 'uuid';
import { jsPDFService } from 'app/shared/services/jsPDF.service'
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { Observable} from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { prompts } from 'assets/js/prompts';

declare let gtag: any;

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [ApiDx29ServerService, jsPDFService, InsightsService],
})

export class UndiagnosedPageComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    medicalTextOriginal: string = '';
    editmedicalText: string = '';
    medicalTextEng: string = '';
    differentialTextOriginal: string = '';
    differentialTextTranslated: string = '';
    copyMedicalText: string = '';
    modalReference: NgbModalRef;
    modalReference2: NgbModalRef;
    topRelatedConditions: any = [];
    diseaseListEn: any = [];
    diseaseListText: string = '';
    lang: string = 'es';
    originalLang: string = 'es';
    detectedLang: string = 'es';
    selectedInfoDiseaseIndex: number = -1;
    _startTime: any;
    myuuid: string = uuidv4();
    currentStep: number = 1;
    questions: any = [];
    answerOpenai: string = '';
    showErrorCall1: boolean = false;
    showErrorCall2: boolean = false;
    callingOpenai: boolean = false;
    loadingAnswerOpenai: boolean = false;
    selectedDisease: string = '';
    showInputRecalculate: boolean = false;
    options: any = {};
    optionSelected: any = {};
    sendingVote: boolean = false;
    sendingFeedbackQuestions: boolean = false;
    selectorOption: string = '';
    symtpmsLabel: string = '';
    feedBack1input: string = '';
    feedBack2input: string = '';
    sending: boolean = false;
    symptomsDifferencial: any = [];
    selectedQuestion: string = '';
    email: string = '';
    checkSubscribe: boolean = false;
    acceptTerms: boolean = false;
    loadMoreDiseases: boolean = false;
    @ViewChild('f') feedbackDownForm: NgForm;
    showErrorForm: boolean = false;
    centro: string;
    stepDisclaimer: number = 1;
    hasAnonymize: boolean = false;
    callingAnonymize: boolean = false;
    tienePrisa: boolean = false;
    resultAnonymized: string = '';
    copyResultAnonymized: string = '';
    feedbackTimestamp = localStorage.getItem('feedbackTimestamp');
    threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000); // 3 meses
    voteId: string = '';
    lastVote: string = '';

    @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
    @ViewChild('textareaedit') textareaEdit: ElementRef;
    constructor(private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService, public toastr: ToastsManager, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private eventsService: EventsService, public jsPDFService: jsPDFService, public insightsService: InsightsService, private renderer: Renderer2) {
        this.initialize();
    }

    private initialize() {
        this.lang = 'es';
        this.originalLang = 'es';
        this._startTime = Date.now();
        this.setUUID();
       
        this.lauchEvent("Init Page");
        this.currentStep = 1;
    }

    private setUUID() {
        if (sessionStorage.getItem('uuid') != null) {
            this.myuuid = sessionStorage.getItem('uuid');
        } else {
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
      }

      async goPrevious() {
        this.topRelatedConditions = [];
        this.currentStep = 1;
        await this.delay(200);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
        this.clearText();
    }

    async newPatient() {
        this.medicalTextOriginal = '';
        this.goPrevious();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
            return false;
        } else {
            return true;
        }
        //return true;
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        if (category == "Info Disease") {
            var subcate = 'Info Disease - ' + this.selectedDisease;
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });
            subcate = 'Info quest - ' + this.selectedDisease + ' - ' + this.selectedQuestion
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });

        }else{
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });

        }
    }

    ngOnInit() {
        this.showwelcome();
        this.loadTranslations();
        this.eventsService.on('backEvent', function (event) {
            if (this.currentStep== 2) {
                this.newPatient();
            }
        }.bind(this));

        this.subscription.add( this.route.queryParams.subscribe(params => {
            this.centro = params['centro'];
            var value = { centro: this.centro, myuuid: this.myuuid}
            
            if(this.centro != undefined && this.centro.length>0){
                this.subscription.add(this.apiDx29ServerService.center(value)
                .subscribe((res: any) => {
                    this.lauchEvent("sendCenter: "+this.centro);
                }, (err) => {
                    this.insightsService.trackException(err);
                    console.log(err);
                }));
            }

            }));
            this.subscribeToEvents();
    }

    subscribeToEvents() {
        this.eventsService.on('changelang', async (lang) => {
            console.log(lang);
            this.lang = lang;
            this.loadTranslations();
            if (this.currentStep == 2 && this.originalLang != lang) {
                swal({
                    title: this.translate.instant("land.Language has changed"),
                    text: this.translate.instant("land.Do you want to start over"),
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#B30000',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
                }).then((result) => {
                    if (result.value) {
                        this.originalLang = lang;
                        this.restartInitVars();
                        this.currentStep = 1;
                    }
                });
            }
        });
    }

    restartInitVars() {
        this.medicalTextOriginal = '';
        this.copyMedicalText = '';
        this.topRelatedConditions = [];
    }

    async loadTranslations() {
        await this.delay(500);
        this.translate.get('land.Symptoms').subscribe((res: string) => {
            this.symtpmsLabel = res;
        });
        this.questions = [
            { id: 1, question: this.translate.instant("land.q1") },
            { id: 2, question: this.translate.instant("land.q2") },
            { id: 3, question: this.translate.instant("land.q3") },
            { id: 4, question: this.translate.instant("land.q4") },
            { id: 5, question: this.translate.instant("land.q5") },
        ];
        this.options = { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1"), description: this.translate.instant("land.descriptionopt1") };
    }

    showwelcome() {
        console.log(sessionStorage.getItem('hideModalwelcome') )
        if (sessionStorage.getItem('hideModalwelcome') == 'false' || !sessionStorage.getItem('hideModalwelcome')) {
            document.getElementById("openModalwelcome").click();
            sessionStorage.setItem('hideModalwelcome', 'true')
        }        
    }

    closewelcome() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }

    prevDisclaimer() {
        this.stepDisclaimer--;
    }

    nextDisclaimer() {
        this.stepDisclaimer++;
        if (this.stepDisclaimer > 6) {
            this.finishDisclaimer();
        }
    }

    finishDisclaimer() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
        localStorage.setItem('hideDisclaimer', 'true')
    }

    showPanelIntro(content) {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'
        };
        this.modalReference = this.modalService.open(content, ngbModalOptions);
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    copyText(par) {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        if (par == 'opt1') {
            this.medicalTextOriginal = this.translate.instant("land.p1.1")
        } else {
            this.medicalTextOriginal = this.translate.instant("land.p1.2")
        }
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
        this.resizeTextArea();
    }

    clearText() {
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.copyMedicalText = '';
        this.showErrorCall1 = false;
        document.getElementById("textarea1").setAttribute("style", "height:50px;overflow-y:hidden; width: 100%;");
        this.resizeTextArea();
    }

    async checkBody(){
        this.showErrorCall1 = false;
        if (this.callingOpenai || this.medicalTextOriginal.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.medicalTextOriginal.length > 0) {
                text = this.translate.instant("land.requiredMIN5");
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.medicalTextOriginal.length)
                })
                text = text + ' ' + introText;
            }
            this.showError(text, null);
        }
        let words = this.countWords(this.medicalTextOriginal);
        if(words>3000){
            let excessWords = words - 3000;
            let errorMessage = this.translate.instant("generics.exceedingWords", {
                excessWords: excessWords
              });
              swal({
                type: 'error',
                html: errorMessage,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
                });
            this.insightsService.trackEvent(errorMessage);
            return;
        }

        if (!this.showErrorCall1) {
            this.preparingCallOpenAi('step1');
        }
    }

    preparingCallOpenAi(step) {
        this.callingOpenai = true;
        if (step == 'step4') {
            var labelMoreSymptoms = this.translate.instant("land.msgmoresymptoms")
            if (this.medicalTextOriginal.indexOf(labelMoreSymptoms) == -1) {
                this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.differentialTextTranslated
                this.medicalTextOriginal = this.medicalTextOriginal + '. ' + labelMoreSymptoms + ' ' + this.differentialTextOriginal;
            } else {
                this.copyMedicalText = this.copyMedicalText + ', ' + this.differentialTextTranslated
                this.medicalTextOriginal = this.medicalTextOriginal + ', ' + this.differentialTextOriginal;
            }
            this.medicalTextEng = this.copyMedicalText;
        }else {
            this.medicalTextEng = this.medicalTextOriginal;
        }
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.continuePreparingCallOpenAi(step);
    }

    continuePreparingCallOpenAi(step) {
        if (step == 'step3' || step == 'step4') {
            this.callOpenAi();
        } else {
            swal({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            var testLangText = this.medicalTextEng.substr(0, 4000)
            if (testLangText.length > 0) {
                this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                    .subscribe((res: any) => {
                        if (res[0].language != 'en') {
                            this.detectedLang = res[0].language;
                            var info = [{ "Text": this.medicalTextEng }]
                            this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
                                .subscribe((res2: any) => {
                                    var textToTA = this.medicalTextEng.replace(/\n/g, " ");
                                    if (res2[0] != undefined) {
                                        if (res2[0].translations[0] != undefined) {
                                            textToTA = res2[0].translations[0].text;
                                        }
                                    }
                                    this.medicalTextEng = textToTA;
                                    this.callOpenAi();
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    console.log(err);
                                    this.callOpenAi();
                                }));
                        } else {
                            this.detectedLang = 'en';
                            this.callOpenAi();
                        }

                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                        this.callingOpenai = false;
                        swal.close();
                    }));
            } else {
                this.callOpenAi();
            }
        }

    }

    callOpenAi() {
        swal.close();
        swal({
            html: '<p>' + this.translate.instant("land.swal") + '</p>' + '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(function (event) {
            if (event.dismiss === "cancel") {
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
            }

        }.bind(this));

        this.callingOpenai = true;
        let introText = prompts.prompt1
        var value = { value: introText.replace("{{description}}", this.medicalTextEng), myuuid: this.myuuid, operation: 'find disease', lang: this.lang}
        if (this.loadMoreDiseases) {
            let introText2 = prompts.prompt2
            value = { value: introText2.replace("{{description}}", this.medicalTextEng).replace("{{diseases_list}}", this.diseaseListText), myuuid: this.myuuid, operation: 'find disease', lang: this.lang }
        }

        this.subscription.add(
            this.apiDx29ServerService.postOpenAi(value).subscribe(
                (res: any) => this.handleOpenAiResponse(res, value),
                (err: any) => this.handleOpenAiError(err)
            )
        );
    }

    handleOpenAiResponse(res: any, value: any) {
        let msgError = this.translate.instant("generics.error try again");
        if (res.result) {
            switch (res.result) {
                case 'blocked':
                    msgError = this.translate.instant("land.errorLocation");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error':
                    msgError = this.translate.instant("generics.error try again");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error openai':
                    msgError = this.translate.instant("generics.sorry cant anwser1");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error max tokens':
                    this.lauchEvent("error max tokens: "+this.medicalTextOriginal.length);
                    msgError = this.translate.instant("generics.sorry cant anwser3");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'success':
                    this.processOpenAiSuccess(res.data, value);
                    break;
                default:
                    this.showError(this.translate.instant("generics.error try again"), null);
                    this.callingOpenai = false;
            }
        } else {
            msgError = this.translate.instant("generics.error try again");
            this.showError(msgError, null);
            this.callingOpenai = false;
        }
    }

    handleOpenAiError(err: any) {
        console.log(err)
        if (err.error.error) {
            if (err.error.error.code == 'content_filter') {
                let msgError = this.translate.instant("generics.sorry cant anwser1");
                this.showError(msgError, err);
                this.callingOpenai = false;
            } else {
                let msgError = this.translate.instant("generics.error try again");
                this.showError(msgError, err);
                this.callingOpenai = false;
            }
        } else if (err.error.type == 'invalid_request_error') {
            if (err.error.code == 'string_above_max_length') {
                this.lauchEvent("error max tokens: "+this.medicalTextOriginal.length);
                let msgError = this.translate.instant("generics.sorry cant anwser3");
                this.showError(msgError, err);
                this.callingOpenai = false;
            } else {
                let msgError = err.error.code + ': ' + err.error.message;
                this.showError(msgError, err);
                this.callingOpenai = false;
            }
        } else {
            let msgError = this.translate.instant("generics.error try again");
            this.showError(msgError, err);
            this.callingOpenai = false;
        }
    }


    showError(message: string, err: any) {
        swal.close();
        swal({
            type: 'error',
            html: message,
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        });
        this.callingOpenai = false;
        if(err!=null){
            this.insightsService.trackException(err);
        }else{
            this.insightsService.trackException(message);
        }
    }

    showSuccess(message: string) {
        swal({
            type: 'success',
            html: message,
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            swal.close();
        }, 2000);
    }

    processOpenAiSuccess(data: any, value: any) {
        //if (this.currentStep == 1) {
            this.copyMedicalText = this.medicalTextEng;
            //}
            this.callAnonymize(value, data);//parseChoices0
            let parseChoices0 = data;
            if (!this.loadMoreDiseases) {
                this.diseaseListEn = [];
            }
            this.setDiseaseListEn(parseChoices0);
            if (this.detectedLang != 'en') {
                var jsontestLangText = this.createTranslationRequests(parseChoices0);
                this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang, jsontestLangText)
                    .subscribe((res2: any) => {
                        if (res2 && res2.length > 0) {
                            let index = 0;
                            parseChoices0.forEach(disease => {
                                let diagnosisTranslation = (res2[index] && res2[index].translations.length > 0 && res2[index].translations[0].text)
                                    ? res2[index].translations[0].text
                                    : disease.diagnosis;
                        
                                index++; // Incrementamos el índice después de usarlo
                        
                                let descriptionTranslation = (res2[index] && res2[index].translations.length > 0 && res2[index].translations[0].text)
                                    ? res2[index].translations[0].text
                                    : disease.description;
                        
                                index++;
                        
                                let symptomsInCommonTranslation = (res2[index] && res2[index].translations.length > 0 && res2[index].translations[0].text)
                                    ? res2[index].translations[0].text
                                    : disease.symptoms_in_common.join('; ');
                        
                                index++;
                        
                                let symptomsNotInCommonTranslation = (res2[index] && res2[index].translations.length > 0 && res2[index].translations[0].text)
                                    ? res2[index].translations[0].text
                                    : disease.symptoms_not_in_common.join('; ');
                        
                                index++;
                        
                                // Asignamos las traducciones al objeto disease
                                disease.diagnosis = diagnosisTranslation;
                                disease.description = descriptionTranslation;
                                disease.symptoms_in_common = symptomsInCommonTranslation.split('; ').filter(symptom => symptom.trim() !== '');
                                disease.symptoms_not_in_common = symptomsNotInCommonTranslation.split('; ').filter(symptom => symptom.trim() !== '');
                            });
                        }
                        this.continueCallOpenAi(parseChoices0);
                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.continueCallOpenAi(parseChoices0);
                    }));
            } else {
                this.continueCallOpenAi(parseChoices0);
            }
    }

    includesElement(array, string) {
        const lowerCaseString = string.toLowerCase();
        return array.some(element => lowerCaseString.includes(element.toLowerCase()));
    }

    createTranslationRequests(diseases) {
        let requests = [];
        diseases.forEach(disease => {
            requests.push({ "Text": disease.diagnosis });
            requests.push({ "Text": disease.description });
            requests.push({ "Text": disease.symptoms_in_common.join('; ') });
            requests.push({ "Text": disease.symptoms_not_in_common.join('; ') });
        });
        return requests;
    }

    async continueCallOpenAi(parseChoices0) {
        let parseChoices = parseChoices0;
        if (!this.loadMoreDiseases) {
            this.topRelatedConditions = [];
        }

        const indexDisease = this.topRelatedConditions.length;
        let names = [];
        parseChoices.forEach((disease, i) => {
            const matchingSymptoms = disease.symptoms_in_common.length > 0 ? disease.symptoms_in_common.join(', ') : this.translate.instant("diagnosis.None");
            const nonMatchingSymptoms = disease.symptoms_not_in_common.length > 0 ? disease.symptoms_not_in_common.join(', ') : this.translate.instant("diagnosis.None");
            const content = `
                <strong>${indexDisease + i + 1}. ${disease.diagnosis}:</strong> ${disease.description}
                <br> <em class="fa fa-check success mr-1"></em>${this.translate.instant("diagnosis.Matching symptoms")}: ${matchingSymptoms}
                <br> <em class="fa fa-times danger mr-1"></em>${this.translate.instant("diagnosis.Non-matching symptoms")}: ${nonMatchingSymptoms}
            `;
            names.push(disease.diagnosis);
            this.topRelatedConditions.push({ content, name: disease.diagnosis, url: '', description: disease.description, matchingSymptoms: matchingSymptoms, nonMatchingSymptoms: nonMatchingSymptoms });
        });
        this.sendNames(names);
        this.loadMoreDiseases = false;
        if (this.currentStep == 1) {
            this.currentStep = 2;
        }
        this.callingOpenai = false;
        swal.close();
        //window.scrollTo(0, 0);
        this.lauchEvent("Search Disease");
        await this.delay(200);
        this.scrollTo();

        if(localStorage.getItem('sentFeedback') == null){
            localStorage.setItem('sentFeedback', 'true')
        }else{
            if(localStorage.getItem('showFeedback') == null || localStorage.getItem('showFeedback') != 'true'){
                if (this.feedbackTimestamp === null || parseInt(this.feedbackTimestamp) < this.threeMonthsAgo) {
                    localStorage.setItem('sentFeedback', 'true')
                }
            }
        } 
    }


    sendNames(names){
        var value = { names: names, myuuid: this.myuuid}
        this.subscription.add(this.apiDx29ServerService.sendNames(value)
            .subscribe((res: any) => {
                console.log(res);
            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
            }));
    }

    setDiseaseListEn(text) {
        text.forEach(item => {
            if (item.diagnosis && item.diagnosis.length > 3) {
                this.diseaseListEn.push(item.diagnosis);
            }
        });
    }

    loadMore() {
        var diseases = this.diseaseListEn.map(disease => '+' + disease).join(', ');
        this.diseaseListText = diseases;
        this.loadMoreDiseases = true;
        this.continuePreparingCallOpenAi('step3');
    }

    async scrollTo() {
        await this.delay(400);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
    }

    cancelCallQuestion() {
        this.symptomsDifferencial = [];
        this.answerOpenai = '';
        this.loadingAnswerOpenai = false;
        this.selectedQuestion = '';
        this.subscription.unsubscribe();
        this.subscription = new Subscription();
    }

    showQuestion(question, index) {
        this.symptomsDifferencial = [];
        this.answerOpenai = '';
        this.loadingAnswerOpenai = true;
        this.selectedQuestion = question.question;
        var selectedDiseaseEn = this.diseaseListEn[this.selectedInfoDiseaseIndex];
        let index2 = selectedDiseaseEn.indexOf('.');
        if (index2 != -1) {
            var temp = selectedDiseaseEn.split(".");
            selectedDiseaseEn = temp[1];
        }
        var introText = question.question + ' ' + selectedDiseaseEn + '?';
        let infoOptionEvent = '';

        //var answerFormat = 'The output should be as HTML but only with <H5> and <p> tags.';
        var answerFormat = 'The output should be as HTML but only with <p>, <li>, </ul>, and <span> tags. Use <strong> for titles';
        if (index == 0) {
            introText = 'What are the common symptoms associated with' + selectedDiseaseEn + '? Please provide a list starting with the most probable symptoms at the top. '+answerFormat;
            infoOptionEvent = 'Common Symptoms';
        }
        if (index == 1) {
            introText = 'Can you provide detailed information about ' + selectedDiseaseEn + ' ? I am a doctor. '+answerFormat;
            infoOptionEvent = 'Detailed Information';
        }
        if (index == 2) {
            introText = 'Provide a diagnosis test for' + selectedDiseaseEn+'. '+answerFormat;
            infoOptionEvent = 'Diagnosis Test';
        }
        if (index == 3) {
            introText = 'Given the medical description: ' + this.medicalTextEng + '. , what are the potential symptoms not present in the patient that could help in making a differential diagnosis for ' + selectedDiseaseEn + '. Please provide only a list, starting with the most likely symptoms at the top.';
            infoOptionEvent = 'Differential Diagnosis';
        }
        if (index == 4) {
            //introText = 'Based on the medical description: '+this.medicalTextEng+', why do you believe the patient has '+selectedDiseaseEn + '. Please indicate the symptoms common with '+selectedDiseaseEn + ' Indicate the common symptoms with '+selectedDiseaseEn +' and those the patient does not have.';
            introText = this.medicalTextEng + '. Why do you think this patient has ' + selectedDiseaseEn + '. Indicate the common symptoms with ' + selectedDiseaseEn + ' and the ones that he/she does not have. '+answerFormat;
            infoOptionEvent = 'Why Diagnosis';
        }

        this.lauchEvent(infoOptionEvent);
        var value = { value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang}
        this.subscription.add(this.apiDx29ServerService.callopenaiquestions(value)
            .subscribe((res: any) => {
                if(res.result){
                    if(res.result == 'blocked'){
                        let msgError = this.translate.instant("land.errorLocation");
                        this.showError(msgError, null);
                        this.loadingAnswerOpenai = false;
                    }else if(res.result == 'error'){
                        let msgError = this.translate.instant("generics.error try again");
                        this.showError(msgError, null);
                        this.loadingAnswerOpenai = false;
                    }else if(res.result == 'error openai'){
                        let msgError = this.translate.instant("generics.sorry cant anwser1");
                        this.showError(msgError, null);
                        this.loadingAnswerOpenai = false;
                    }else if(res.result == 'success'){
                        this.processQuestionSuccess(res.data, index);
                    }
                }else {
                    let msgError = this.translate.instant("generics.sorry cant anwser2");
                    this.showError(msgError, null);
                    this.loadingAnswerOpenai = false;
                }

            }, (err) => {
                console.log(err);
                let msgError = this.translate.instant("generics.error try again");
                this.showError(msgError, err);
                this.loadingAnswerOpenai = false;
            }));

    }

    processQuestionSuccess(data: any, index: number) {
        data = data.replace(/^```html\n|\n```$/g, '');
        let content = data;
        let splitChar = content.indexOf("\n\n") >= 0 ? "\n\n" : "\n";
        let contentArray = content.split(splitChar);

        let startIndex = contentArray.findIndex(item => item.trim().startsWith("1."));

        if (startIndex >= 0) {
            contentArray = contentArray.slice(startIndex);
        }

        let parseChoices0 = contentArray.join(splitChar);
        if (index == 3) {
            // Eliminar asteriscos dobles
            parseChoices0 = parseChoices0.replace(/\*\*/g, '');
            if (this.detectedLang != 'en') {
                var jsontestLangText = [{ "Text": parseChoices0[0] }]
                if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                    const sendInfo = parseChoices0.join('\n');
                    jsontestLangText = [{ "Text": sendInfo }];
                }
                if (!Array.isArray(parseChoices0)) {
                    jsontestLangText = [{ "Text": parseChoices0 }]
                }

                this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang, jsontestLangText)
                    .subscribe((res2: any) => {
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                parseChoices0 = res2[0].translations[0].text;
                                if (parseChoices0.indexOf("1") == 0) {
                                    parseChoices0 = "\n" + parseChoices0;
                                }
                            }
                        }
                        this.getDifferentialDiagnosis(parseChoices0);
                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.getDifferentialDiagnosis(data);
                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }));
            } else {
                this.getDifferentialDiagnosis(data);
                this.loadingAnswerOpenai = false;
                this.lauchEvent("Info Disease");
            }
        } else {
            var tempInfo = data;
            if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                tempInfo = parseChoices0.join('\n');
            } else if (parseChoices0.length == 1) {
                tempInfo = parseChoices0[0]
            }
            if(this.detectedLang != 'en'){
                var info = [{ "Text": tempInfo }]
                this.subscription.add(this.apiDx29ServerService.getTranslationInvert(this.detectedLang, info)
                    .subscribe((res2: any) => {
                        var textToTA = tempInfo;
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                textToTA = res2[0].translations[0].text;
                            }
                        }
                        this.answerOpenai = textToTA;

                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                            this.answerOpenai = parseChoices0.join('\n');
                        } else if (parseChoices0.length == 1) {
                            this.answerOpenai = parseChoices0[0]
                        } else {
                            this.answerOpenai = data;
                        }

                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }));
            }else{
                this.answerOpenai = tempInfo;

                this.loadingAnswerOpenai = false;
                this.lauchEvent("Info Disease");
            }
        }
    }

    getDifferentialDiagnosis(info) {
        var parseChoices = info.split("\n");
        this.symptomsDifferencial = [];
        this.symptomsDifferencial = parseChoices
          .filter(choice => choice !== '' && choice !== ' ' && choice !== ':')
          .map(choice => {
            let index = choice.indexOf('.');
            var name = choice.split(".")[1];
            if (index !== -1) {
              name = choice.substring(index + 1);
            }
            if (name.charAt(name.length - 1) === '.') {
              name = name.substring(0, name.length - 1);
            }
            if (name.charAt(name.length - 1) === ' ') {
              name = name.substring(0, name.length - 1);
            }
            return { name: name, checked: false };
          });
      }

    changeSymptom(event,index){
     console.log(event); 
    }

    recalculateDifferencial() {
        var newSymptoms = this.symptomsDifferencial
          .filter(symptom => symptom.checked)
          .map(symptom => symptom.name)
          .join(', ');
          newSymptoms = newSymptoms.trim().replace(/(,| )+$/, '');
        if (newSymptoms !== '') {
          this.lauchEvent("Recalculate Differencial");
          this.optionSelected = this.options;
          this.closeDiseaseUndiagnosed();
          this.differentialTextOriginal = newSymptoms;
          this.verifCallDifferential();
        } else {
          this.showError(this.translate.instant("land.Select at least one symptom"), null);
        }
      }

      verifCallDifferential() {
        this.showErrorCall2 = false;
        if (this.callingOpenai || this.differentialTextOriginal.length == 0) {
            this.showErrorCall2 = true;
            let msgError = this.translate.instant("land.required");
            this.showError(msgError, null);
        }
        if (!this.showErrorCall2) {
            this.callOpenAiDifferential();
        }
    }

    callOpenAiDifferential() {
        if (this.differentialTextOriginal.length > 0) {
            swal({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            if(this.detectedLang != 'en'){
                var info = [{ "Text": this.differentialTextOriginal }]
                this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(this.detectedLang, info)
                    .subscribe((res2: any) => {
                        var textToTA = this.differentialTextOriginal.replace(/\n/g, " ");
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                textToTA = res2[0].translations[0].text;
                            }
                        }
                        this.differentialTextTranslated = textToTA;
                        this.preparingCallOpenAi('step4');
                    }, (err) => {
                        this.differentialTextTranslated = this.differentialTextOriginal;
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.preparingCallOpenAi('step4');
                    }));
            }else{
                this.differentialTextTranslated = this.differentialTextOriginal;
                this.preparingCallOpenAi('step4'); 
            }
        } else {
            this.preparingCallOpenAi('step4');
        }
    }

    closeDiseaseUndiagnosed() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
    }


    showMoreInfoDiseasePopup(diseaseIndex, contentInfoDisease) {
        this.answerOpenai = '';
        this.symptomsDifferencial = [];
        this.selectedInfoDiseaseIndex = diseaseIndex;
        var nameEvent = 'Undiagnosed - Select Disease - ' + this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
        this.lauchEvent(nameEvent);
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.modalReference = this.modalService.open(contentInfoDisease, ngbModalOptions);
        this.selectedDisease = this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
    }

    copyResults() {
        var finalReport = "";
        var infoDiseases = this.getPlainInfoDiseases2();
        if (infoDiseases != "") {
            finalReport = this.translate.instant("diagnosis.Proposed diagnoses") + ":\n" + infoDiseases;
        }

        const textarea = document.createElement('textarea');
        textarea.textContent = finalReport;
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            let msgSuccess = this.translate.instant("land.Results copied to the clipboard");
            this.showSuccess(msgSuccess);
            this.lauchEvent("Copy results");
        } catch (err) {
            console.error('No se pudo copiar el texto: ', err);
        }

        document.body.removeChild(textarea);
        

    }

    getPlainInfoDiseases2() {
        return this.topRelatedConditions.map(condition => condition.name).join("\n");
      }

    downloadResults() {
        if (!this.callingAnonymize) {
            this.jsPDFService.generateResultsPDF(this.medicalTextOriginal, this.topRelatedConditions, this.lang)
            this.lauchEvent("Download results");
        }
    }


    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    getMoreInfoAriaLabel(diseaseName: string): string {
        return `${this.getLiteral('generics.More information')} (${diseaseName})`;
      }

    vote(valueVote, contentFeedbackDown) {
        this.sendingVote = true;
        let introText = prompts.prompt1

        var value = { value: introText + this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions }
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.voteId = res.id;
                this.lastVote= valueVote;
                this.lauchEvent("Vote: " + valueVote);
                this.sendingVote = false;
                if (valueVote == 'down') {
                    let ngbModalOptions: NgbModalOptions = {
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'ModalClass-sm'// xl, lg, sm
                    };
                    if (this.modalReference != undefined) {
                        this.modalReference.close();
                        this.modalReference = undefined;
                    }
                    this.modalReference = this.modalService.open(contentFeedbackDown, ngbModalOptions);
                } else {
                    let msgSuccess = this.translate.instant("land.thanks");
                    this.showSuccess(msgSuccess);
                }

            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                this.sendingVote = false;
            }));
    }

    submitInvalidForm() {
        this.showErrorForm = true;
        if (!this.feedbackDownForm) { return; }
        const base = this.feedbackDownForm;
        for (const field in base.form.controls) {
            if (!base.form.controls[field].valid) {
                base.form.controls[field].markAsTouched()
            }
        }
    }

    onSubmitFeedbackDown() {
        this.showErrorForm = false;
        this.sending = true;
        let introText = prompts.prompt1

        var value = { voteId: this.voteId, email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: introText + this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe }
        this.subscription.add(this.apiDx29ServerService.feedback(value)
            .subscribe((res: any) => {
                this.lauchEvent("Feedback");
                this.sending = false;
                this.feedBack1input = '';
                this.feedBack2input = '';
                this.checkSubscribe = false;
                this.acceptTerms = false;
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }
                let msgSuccess = this.translate.instant("land.thanks");
                this.showSuccess(msgSuccess);
            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                this.sending = false;
            }));


    }

    closeFeedback() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.checkSubscribe = false;
        this.acceptTerms = false;
        let msgSuccess = this.translate.instant("land.thanks");
        this.showSuccess(msgSuccess);
    }

    countWords(text) {
        text = text.trim();
        if (text === '') {
          return 0;
        }
        return text.split(/\s+/).length;
      }

    resizeTextArea() {
        this.resizeTextAreaFunc(this.textAreas);
    }

    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    private resizeTextAreaFunc(elements: QueryList<ElementRef>) {
        elements.forEach((element: ElementRef) => {
            const nativeElement = element.nativeElement;
            this.renderer.listen(nativeElement, 'input', () => {
                let height = nativeElement.scrollHeight;
                if (height < 50) height = 50;
                this.renderer.setStyle(nativeElement, 'height', `auto`);
                this.renderer.setStyle(nativeElement, 'height', `${height}px`);
            });
            let height = nativeElement.scrollHeight;
            if (height < 50) height = 50;
            this.renderer.setStyle(nativeElement, 'height', `${height}px`);
        });
    }

      showContentInfoAPP(contentInfoAPP) {
        var nameEvent = 'showContentInfoAPP';
        this.lauchEvent(nameEvent);
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.modalReference = this.modalService.open(contentInfoAPP, ngbModalOptions);
        
    }

    callAnonymize(value, response) {
        this.callingAnonymize = true;
        this.hasAnonymize = false;
        this.resultAnonymized = '';
        this.copyResultAnonymized = '';
        const info = { value: this.medicalTextOriginal, myuuid: value.myuuid, operation: value.operation, lang: this.lang, response: response, topRelatedConditions: this.topRelatedConditions};
        
        this.subscription.add(this.apiDx29ServerService.postAnonymize(info)
            .subscribe((res: any) => {
                if (res.result) {
                    if (res.result === 'blocked') {
                        const msgError = this.translate.instant("land.errorLocation");
                        this.showError(msgError, null);
                    }
                    this.callingAnonymize = false;
                    this.hasAnonymize = true;
                } else {
                    let parseChoices = res.choices[0].message.content;
                    parseChoices = parseChoices.replace(/^\s*"""\s*/, '').replace(/\s*"""\s*$/, '');
                    let parts = parseChoices.split(/(\[ANON-\d+\])/g);
                    let partsCopy = [...parts];  // Make a shallow copy of parts
    
                    if (parts.length > 1) {
                        parts = parts.map((part, i) => {
                            if (/\[ANON-\d+\]/.test(part)) {
                                const length = parseInt(part.match(/\d+/)[0]);
                                const blackSpan = `<span style="background-color: black; display: inline-block; width:${length}em;">&nbsp;</span>`;
                                partsCopy[i] = '*'.repeat(length);
                                return blackSpan;
                            }
                            return part;
                        });
    
                        this.resultAnonymized = parts.join('').replace(/\n/g, '<br>');
                        this.copyResultAnonymized = partsCopy.join('').replace(/\n/g, '<br>');
                        this.medicalTextOriginal = this.copyResultAnonymized;
    
                        if (this.detectedLang !== 'en') {
                            const info = [{ "Text": this.copyResultAnonymized }];
                            this.subscription.add(this.apiDx29ServerService.getTranslationInvert(this.detectedLang, info)
                                .subscribe((res2: any) => {
                                    let textToTA = this.copyResultAnonymized;
                                    if (res2[0] && res2[0].translations && res2[0].translations.length > 0 && res2[0].translations[0].text) {
                                        textToTA = res2[0].translations[0].text;
                                    }
                                    this.copyResultAnonymized = textToTA;
                                    this.medicalTextEng = this.copyResultAnonymized;
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    this.medicalTextEng = this.copyResultAnonymized;
                                }));
                        } else {
                            this.medicalTextEng = this.copyResultAnonymized;
                        }
    
                        this.callingAnonymize = false;
                        this.hasAnonymize = true;
    
                        if (!localStorage.getItem('dontShowSwal')) {
                            const detectePer = this.translate.instant("diagnosis.detected personal information");
                            const procDelete = this.translate.instant("diagnosis.proceeded to delete");
                            const msgcheck = this.translate.instant("land.check");
                            swal({
                                type: 'info',
                                html: `<p>${detectePer}</p><p>${procDelete}</p><br><br><input type="checkbox" id="dont-show-again" class="mr-1">${msgcheck}`,
                                showCancelButton: false,
                                showConfirmButton: true,
                                allowOutsideClick: false
                            }).then((result) => {
                                if ((document.getElementById('dont-show-again') as HTMLInputElement).checked) {
                                    localStorage.setItem('dontShowSwal', 'true');
                                }
                            });
                        } else {
                            this.mostrarFinalizacionAnonimizado(true);
                        }
                    } else {
                        this.callingAnonymize = false;
                        this.hasAnonymize = false;
                        this.mostrarFinalizacionAnonimizado(false);
                    }
                }
            }, (err) => {
                console.log(err);
                this.insightsService.trackException(err);
                this.callingAnonymize = false;
                this.hasAnonymize = false;
                this.mostrarFinalizacionAnonimizado(false);
            }));
    }

    mostrarFinalizacionAnonimizado(detectedText) {
        if (this.tienePrisa) {
            const message = detectedText 
                ? this.translate.instant("diagnosis.correctly anonymized") 
                : this.translate.instant("diagnosis.not detected personal information");
            
            swal({
                type: 'success',
                html: message,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            }).then((result) => {
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }
            });
    
            this.tienePrisa = false;
        }
    }

    openAnonymize(contentviewDoc){
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm' // xl, lg, sm
          };
          if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
          }
          this.modalReference = this.modalService.open(contentviewDoc, ngbModalOptions);
    }

    closeModal() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
      }

      async openDescripModal(panel) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.editmedicalText = this.medicalTextOriginal;
        this.modalReference = this.modalService.open(panel, ngbModalOptions);
        await this.delay(500);
      setTimeout(() => {
        const modalElement = document.getElementById('textareaedit');
        if (modalElement) {
          this.textareaEdit = new ElementRef(modalElement);
          if (this.textareaEdit) {
            const textarea = this.textareaEdit.nativeElement as HTMLTextAreaElement;
            this.resizeTextArea2(textarea);
          }
        }
      }, 0);       
        
    }

    resizeTextArea2(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 10 + 'px';
      }

    async checkText(step) {
        this.showErrorCall1 = false;
        if (this.callingOpenai || this.editmedicalText.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.editmedicalText.length > 0) {
                text = this.translate.instant("land.requiredMIN5");
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.editmedicalText.length)
                })
                text = text + ' ' + introText;
            }
            this.showError(text, null);
        }
        if (!this.showErrorCall1) {
            let words = this.countWords(this.editmedicalText);
            if(words>3000){
                let excessWords = words - 3000;
                let errorMessage = this.translate.instant("generics.exceedingWords", {
                    excessWords: excessWords
                });
                swal({
                    type: 'error',
                    html: errorMessage,
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                    });
                this.insightsService.trackEvent(errorMessage);
                return;
            }
            this.closeModal();
            this.medicalTextOriginal = this.editmedicalText;
            this.preparingCallOpenAi(step);
        }
    }

    async openModal2(panel) {
        let ngbModalOptions: NgbModalOptions = {
          backdrop : 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference2 = this.modalService.open(panel, ngbModalOptions);
        await this.delay(400);
        document.getElementById('initpopup2').scrollIntoView(true);
      }

      onTermsAccepted() {
        this.acceptTerms = true;
        this.modalReference2.close();
      }

}
