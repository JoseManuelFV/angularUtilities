export interface iNextObservable {
    url:string,
    methods:iMethods,
    header?:any,
    body?:any,
}
export enum iMethods{
    GET,
    POST,
    PUT,
    DELETE,
}
export interface iResultData {
    status: number,
    message: string,
    data: any,
    extraData?: any
}
