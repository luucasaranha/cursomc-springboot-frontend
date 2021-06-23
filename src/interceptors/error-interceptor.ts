import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { StorageService } from "../services/storage.service";
import { AlertController } from "ionic-angular/components/alert/alert-controller";
import { FieldMessage } from "../models/fieldmessage";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(public storage: StorageService,
                public alertCtrl: AlertController        
        ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req)
        .catch((error, caught) => {

            let errorObj = error;
            if(errorObj.error) {
                errorObj = errorObj.error;
            }

            if(!errorObj.status) {
                errorObj = JSON.parse(errorObj);
            }

            switch(errorObj.status) {
                case 401:
                    this.handle401();
                    break;

                case 403:
                    this.handle403();
                    break;

                case 422:
                    this.handle422(errorObj);
                    break;

                default:
                    this.handleDefaultError(errorObj);
                    break;

            }

            console.log('Erro detectado pelo interceptador:');
            console.log(errorObj);

            return Observable.throw(errorObj);
        }) as any;
    }

    handle422(errorObj) {
        let alert = this.alertCtrl.create({
            title: 'Erro de validação',
            message: this.listErrors(errorObj.errors),
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: 'OK'
                }
            ] 
        });
        alert.present();
    }

    handle403() {
        this.storage.setLocalUser(null);
    }

    handle401() {
        let alert = this.alertCtrl.create({
            title: 'Falha de autenticação',
            message: 'Email ou senha incorretos',
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: 'OK'
                }
            ] 
        });
        alert.present();
    }

    handleDefaultError(error) {
        let alert = this.alertCtrl.create({
            title: 'Erro ' + error.status + ': ' + error.error,
            message: error.message,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: 'OK'
                }
            ] 
        });
        alert.present();
    }

    private listErrors(messages : FieldMessage[]) : string {
        let s : string = '';
        for(var i = 0; i < messages.length; i++) {
            s = s + '<p><strong>' + messages[i].message + '</strong></p>';
        }
        console.log(s);
        return s;
    }

}

export const ErrorInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true,
};
