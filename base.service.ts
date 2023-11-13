import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenManagerService } from './tokenManager.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SubjectManagerService } from './subjectManager.service';
import { iMethods, iNextObservable, iResultData } from './iHelpersAPI';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  constructor(private _http:HttpClient){}

  private _methodsRefreshToken: Array<{ method: Function, args: Array<any> }> = [];
  private _alreadyListener:any;
  private _unsub = new Subject<any>();

  protected urlApi = environment.urlApi;

  /**
   * Function for making API calls, handling them, and implementing return to all components with Subjects and BehaviorSubjects in a straightforward manner
   * @param {{id:string, isBehavior?:boolean}} observableIdentifictor
   * @param {{id:string, isBehavior?:boolean}} observableErrorIdentificator
   * @param {iNextObservable} data
   * @param {Function} [successTransformFunction]
   * @param {{method:Function,args:Array<any>}} [methodCall]
   * 
   * @example
   * this.sendNextObsevable(
   *  {id:'login.login'},
   *  {id:'login.login.error'},
   *  {
   *    url:this.urlApi+"/api/login_check",
   *    methods:iMethods.POST,
   *    body:{username: email, password: pass}
   *  },(data)=>{
   *    this.setToken(data.token);
   *    return data;
   *  },{
   *    method: this.login, args:[email, password]
   *  }
   * )
   * @returns {any}
   */
  protected sendNextObsevable(
    observableNext:{id:string, isBehavior?:boolean},
    observableError:{id:string, isBehavior?:boolean},
    data:iNextObservable,
    successTransformFunction=this.defaultTransformFunction, 
    methodCall?:{method:Function, args:Array<any>}
  ){
    let ob;
    switch(data.methods){
      case iMethods.DELETE: 
        ob = this._http.delete(data.url,data.header); 
        break;
      case iMethods.GET: 
        ob = this._http.get(data.url,data.header);
        break;
      case iMethods.POST: 
        ob = this._http.post(data.url,data.body,data.header); 
        break;
      case iMethods.PUT: 
        ob = this._http.put(data.url,data.body,data.header); 
        break;
    }
    SubjectManagerService.createSubject(observableNext.id, (observableNext.isBehavior || false));
    SubjectManagerService.createSubject(observableError.id, (observableNext.isBehavior || false));
    ob.subscribe({
      next: data=>{
        let tran = successTransformFunction(data);
        SubjectManagerService.sendDataSubject(observableNext.id,tran);
        this.slowClearSubject(observableNext.id)
      }, error: error=>{
        this.controlHttpError(error, methodCall)
        SubjectManagerService.sendDataSubject(observableError.id,error);
        this.slowClearSubject(observableError.id);
      }
    })
  }

  private slowClearSubject(observableId:string){
    setTimeout(() => {
      SubjectManagerService.clearSubject(observableId);
    }, 500);
  }
  
  /**
   * It serves to handle and standardize the response of a call.
   * @param {number} status Status API call
   * @param {any} data Data send
   * @param {string} [message] Return message
   * @returns {any}
   */
  protected parseResultData(status:number, data:any, message?:'', extraData?:any):iResultData{
    return {
      status:status,
      data:data,
      message:message ?? '',
      extraData:extraData
    };
  }
  
  /**
   * Internal method that refreshes all methods that had previously failed with a 401 error due to the absence of a token. When it retrieves the token again, it refreshes it once more
   * @param methodCall The method that has thrown an error can be null to prevent issues (as it is optional to be called once the token refreshing is complete).
   */
  private listenerRefreshToken(methodCall?: { method: Function, args: Array<any> }) {
    if (methodCall != null) {
      this._methodsRefreshToken.push(methodCall);
    } else {
      console.error("Exist one method without error methodCall");
    }
    if (!this._alreadyListener) {
      this._alreadyListener = true;
      TokenManagerService.listenerRefreshTokenComplete().pipe(takeUntil(this._unsub)).subscribe(value => {
        setTimeout(() => {
          this._alreadyListener = false;
          this.reloadMethodRefreshToken();
          this._unsub.next("");
        }, 100);
      })
      TokenManagerService.startTokenRefresh();
    }
  }

  /**
   * Method to call all methods that have encountered a 401 error
   */
  protected reloadMethodRefreshToken() {
    setTimeout(() => {
      this._methodsRefreshToken.forEach((element: { method: Function, args: Array<any> }, i) => {
        let _this:any = this;
        _this[element.method.name](...element.args);
      });
      this._methodsRefreshToken = [];
    }, 1000);
  }

  /**
   * Method to check if token refreshing is necessary. If a 401 error occurs, it refreshes the token; if a 403 error occurs for security reasons, it logs out
   * @param {Object} data The object returned by the HTTP request
   * @param methodCall The method where you want to retry the failed call (to prevent the user from noticing the error) and refresh the token in the process
   */
  protected controlHttpError(data: any, methodCall?: { method: Function, args: Array<any> }){
    if (data.status == 401) { this.listenerRefreshToken(methodCall) }
    if (data.status == 403) { TokenManagerService.tokenLost(); }
  }

  /**
   * Set token
   * @param {String} token Token
   */
  protected setToken(token: string) { localStorage.setItem('token', token) }

  /**
   * Return token
   * @returns {String} Token de la API
   */
  protected getToken() { return localStorage.getItem('token'); }

  /**
   * Function that returns the header with the token if it is configured
   * @returns {Object} Return HttpHeaders
   */
  protected getHeader() {
    if (localStorage.getItem("token") != null || localStorage.getItem("token") != undefined) {
      return { headers: new HttpHeaders({ Authorization: "Bearer " + localStorage.getItem("token") }) }
    }
    return { headers: new HttpHeaders({ Authorization: "No Auth" }) }
  }

  /**
   * Method that converts an array into an object with a key and an array. It is useful especially for deleting multiple items in a DELETE request... Backend folks.
   * @param {Array} arraySend - [1,2,3,4,5,6]
   * @param {String} objectIndex - product_ids
   * @returns {Object} - { producto_ids: [1,2,3,4,5,6] }
   */
  protected convertArrayObject(arraySend: Array<any>, objectIndex:any):any{
    let ob:any = {};
    ob[objectIndex] = arraySend;
    return ob;
  }

  /**
   * Especially useful when sending information in DELETE requests. When the DELETE request allows for a body, but the method puts it at the same level as the headers and not as a separate parameter.
   * @param {Object} bodyOptions - { productId: 5, string: "Test" }
   * @returns {Object} - { headers: ... , body: { productId: 5, string: "Test" } }
   */
  protected sendBodyOptions(bodyOptions:any) {
    if (bodyOptions != null) {
      return { headers: this.getHeader().headers, body: bodyOptions };
    }
    return this.getHeader();
  }


  /**
   * To send data in the URL as queryParams (url?data). It is used mainly in GET requests when you need to pass data.
   * @param {Object} options - { num_data: 5, num_pag: 1}
   * @returns {String} - ?num_data=5,num_pag=1
   */
  protected optionsQueryParams(options:any):string{
    let ret = "";
    let ind = 0;
    for (let opt of Object.keys(options)) {
      if (ind != 0){ ret = ret+"&"; }
      let valueKey = options[opt]
      if (options[opt] instanceof Array) {
        valueKey = options[opt].join(",");
      }
      ret = ret+opt+"="+encodeURIComponent(valueKey);
      ind++;
    }
    if(ret != ""){
      ret = "?"+ret;
    }
    return ret;
  }

  /**
   * Custom Hash
   * @returns {String} - AA6DA024
   */
  hash(stringHas:string) {
    let hash = 0;
    let string = stringHas.toLowerCase();
    for(let i=0; i < string.length; i++) {
      let letter = string.charCodeAt(i);
      hash = hash + letter;
      hash += (hash << 10 >>> 0);
      hash ^= (hash >>> 6);
      hash = hash >>> 0
    }

    hash += (hash << 3);
    if (hash < 0) {
      hash = hash >>> 0
    }
    hash ^= (hash >>> 11);
    hash += (hash << 15);
    if (hash < 0) {
      hash = hash >>> 0
    }
    return hash.toString(16).toUpperCase();
  }

  private defaultTransformFunction(data:any){
    return data;
  }
}
