import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenManagerService {

  protected static _refreshTokenComplete = new Subject<any>();
  protected static _startTokenRefresh = new Subject<any>();
  protected static _tokenLost = new Subject<any>();
  
  /** Triggers the listener for when you lose the token */
  public static tokenLost(){
    localStorage.removeItem('token');
    this._tokenLost.next(true);
  }
  /** Triggers the listener for when you need refresh token */
  public static startTokenRefresh(){ this._startTokenRefresh.next(true); }
  /** Triggers the listener for when you COMPLETE refresh token */
  public static completeRefreshToken(){ this._refreshTokenComplete.next(true); }

  /* Listener when API calls return error 401 */
  public static listenerStartRefreshToken(){ return this._startTokenRefresh; };
  /* Listener when finish refresh token */
  public static listenerRefreshTokenComplete(){ return this._refreshTokenComplete; };
  /* Listener when loss token */
  public static listenerTokenLost(){ return this._tokenLost; };

  public static parseJwt(token:string){
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }
  /**
   * Return token parsed in object
   * @param {string} token 
   * @returns {Object}
   */
  public static getParseToken(token:any){
    var base64Url = token.split('.')[1];
    return JSON.parse(atob(base64Url));
  }
}
