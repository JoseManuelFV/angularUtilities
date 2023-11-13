import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { SubjectManagerService } from "./subjectManager.service";

@Injectable({
    providedIn: 'root'
})
export class iUnsubscribeDestroy implements OnDestroy {
    private _subList:Record<number,Subject<any>>={}
    _unsub = new Subject<any>();
    
    ngOnDestroy(): void {
        this._unsub.next(" ");
        for (const subID in Object.keys(this._subList)) {
            this._subList[subID].next(" ");
            delete this._subList[subID];
        }
    }
    
    /**
     * Generate new unsubscribe
     * @example
     * let {idUnsub, unsub} = _newUnsubInd();
     * @example
     * let generateUn = _newUnsubInd();
     * console.log(generateUn.idUnsub);
     * generateUn.unsub.next(" ");
     * 
     * @returns {{idUnsub:number, unsub:Subject<any>}}
     */
    _newUnsubInd(){
        let identificator = this._randomNumber();
        while (this._subList[identificator] != null){
            identificator = this._randomNumber();
        }
        this._subList[identificator] = new Subject<any>();
        return {idUnsub:identificator, unsub:this._subList[identificator]};
    }

    /**
     * Clear unbuscribe subject by identifier
     * @param {number} identificator 
     */
    _unsubComplete(identificator:number){
        this._subList[identificator].next(" ");
        delete this._subList[identificator];
    }

    /**
     * Shortcut to listen to a Subject until the component is closed; it is usually listened to within the constructor.
     * @param {string} subjName Identifier of subject success
     * @param {Function} method Fired when value is not null (BehaviorSubject fired null value first)
     */
    _listenGeneralSubject(subjName:string, method:(data: any) => any){
        SubjectManagerService.getSubject(subjName).pipe(takeUntil(this._unsub)).subscribe(value=>{
            if(value==null){return;}
            method(value);
        })
    }

    /**
     * Shortcut to listen to a subject for an API call, handling both success and error subject
     * @param subjSuccessName Identifier of subject success
     * @param subjErrorName Identifier of subject error
     * @param methodSucess Method fired when success
     * @param methodError Method fired when error
     */
    _listenIndividualAPISubject(subjSuccessName:string, subjErrorName:string, methodSucess?:(data: any) => any, methodError?:(data: any) => any){
        let {idUnsub, unsub} = this._newUnsubInd();
        SubjectManagerService.getSubject(subjSuccessName).pipe(takeUntil(unsub)).subscribe(value=>{
            if(methodSucess!=null){
                methodSucess(value);
            }
            this._unsubComplete(idUnsub);
        })
        SubjectManagerService.getSubject(subjErrorName).pipe(takeUntil(unsub)).subscribe(value=>{
            if(methodError!=null){
                methodError(value);
            }
            this._unsubComplete(idUnsub);
        })
    }

    /**
     * Shortcut to listen to a subscribe once and unsubscribe when data is received.
     * @param subject Listener
     * @param methodSuccess Method when success
     * @example
     * popup.open();
     * this._listenerIndividualSubject(subjectListener,(data)=>{
     *   console.log('Popup close whit data');
     * });
     * 
     */
    _listenerIndividualSubject(subject:Subject<any>|BehaviorSubject<any>,methodSuccess?:(data: any) => any){
        let {idUnsub, unsub} = this._newUnsubInd();
        subject.pipe(takeUntil(unsub)).subscribe(value=>{
            if(methodSuccess!=null){
                methodSuccess(value);
            }
            this._unsubComplete(idUnsub);
        })
    }
    
    /**
     * Genrate random number to identifier unsubscribe
     * @returns {number}
     */
    private _randomNumber(){
        return Math.floor(Math.random() * 50000);
    }
}
