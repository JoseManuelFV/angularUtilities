import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubjectManagerService {
  protected static _subjects:Record<string,Subject<any>|BehaviorSubject<any>> = {};

  /**
   * Create new subject
   * The main difference between a BehaviorSubject and a Subject is that the BehaviorSubject returns the last data set in the Subject,
   * this is useful to prevent API calls from taking too long between components and to fetch data that 80% of the calls usually return the same data.
   * @param {string} nameIdentificator - Identifier
   * @param {boolean} isBehavior - Whether it has to be a behavior or not
   * @returns {any}
   */
  static createSubject(nameIdentificator:string,isBehavior=true):Subject<any>|BehaviorSubject<any>{
    let subj:Subject<any>|BehaviorSubject<any>;
    if(isBehavior){
      subj = new BehaviorSubject<any>(null);
    }else{
      subj = new Subject<any>();
    }
    if(this.hasExists(nameIdentificator)){
      return this._subjects[nameIdentificator];
    }
    this._subjects[nameIdentificator] = subj;
    return this._subjects[nameIdentificator];
  }

  /**
   * Clean values of subject
   * @param {string} nameIdentificator - Identifier
   */
  static clearSubject(nameIdentificator:string){
    let sub = this._subjects[nameIdentificator];
    if(sub instanceof BehaviorSubject){
      sub.next(null);
    }
  }

  /**
   * To retrieve the subject based on an identifier
   * @param {string} nameIdentificator - Identifier
   * @returns {Subject<any>|BehaviorSubject<any>}
   */
  static getSubject(nameIdentificator:string):Subject<any>|BehaviorSubject<any>{
    let sub = this._subjects[nameIdentificator];
    if (sub == null){
      sub = this.createSubject(nameIdentificator);
    }
    return sub;
  }

  /**
   * Send new data to Subject
   * @param {string} nameIdentificator - Identifier
   * @param {any} value - Nuevo valor
   */
  static sendDataSubject(nameIdentificator:string,value:any){
    this._subjects[nameIdentificator].next(value);
  }

  /**
   * Delete subject
   * @param {string} nameIdentificator - Identifier
   */
  static destroySubject(nameIdentificator:string){
    delete this._subjects[nameIdentificator];
  }

  /**
   * If the current subject exists or not
   * @param {string} nameIdentificator - Identifier
   * @returns {boolean}
   */
  static hasExists(nameIdentificator:string){
    let find = Object.keys(this._subjects).find(e=>e==nameIdentificator);
    if(find != null){
      return true;
    }
    return false;
  }

}
