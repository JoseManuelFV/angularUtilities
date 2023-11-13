# angularUtilities
Files that I have been using in all my projects for quite some time and that I have been developing and improving over time.

> **IMPORTANT**
> The files are closely linked to each other. I strongly recommend that you look at the dependencies of each file.
> The files without significant dependencies are iHelperAPI, tokenManager.service.ts and subjectManager.service.ts. However iHelperAPI and tokenManager are almost useless without base.service.ts.

## What uses each file has?

- base.service.ts: Arises from the need to streamline call requests and, at the same time, parse the data into data types. It allows listening to the same call in different components without repeating the same code across them (that's what Services are for)... For example: PHP returns the date as a string, converting it into a Date makes it much easier to handle.
- iHelpersAPI.ts: Simply separating the data types from base.service.ts, as when you reference these objects, you don't necessarily have to reference base.service.ts. It wouldn't make sense
- iUnsubscribeDestroy.ts: It is used to listen to the calls created by base.service.ts and subjectManager and to control their unsubscription (stop listening). It provides various functionalities to listen continuously until the component is closed or to force the closure of that subject
- subjectManager.service.ts: Controls all subjects through an identifier, allowing you to listen to any subject from anywhere without having to instantiate it again.
- tokenManager.service.ts: If you have control of the JWT token, this will help you manage that token without it expiring. How you handle the loss of the token is up to you :)


## Examples

```typescript 
  // example.component.ts
class ExampleComponent extends iUnsubscribeDestroy implements OnInit{
  constructor(public examSe:ExampleService) { 
    super();
  }
  ngOnInit() {
    this.examSe.getAll();
    this._listenGeneralSubject('example.getAll',(value:iResultData)=>{
      console.log(value.data);
    })
  }
```
```typescript
  // example.service.ts
class ExampleService extends BaseService {

  constructor(protected http:HttpClient) { 
    super(http);
  }

  getAll(page:number=0,amount:number=50,search:string=''){
    let params = this.optionsQueryParams({page:page,amount:amount, search:search})
    this.sendNextObsevable(
      {id:'example.getAll', isBehavior: true},
      {id:'example.getAll.error', isBehavior: false},
      {
        url: this.urlApi+'/api/example/all'+params,
        methods:iMethods.GET,
        header:this.getHeader(),
      },(data)=>{
        return this.parseResultData(data.status,data.data,data.message,data.extraData);
      },{
        method: this.getAll,args:[page,amount,search]
      }
    )
  }
}
```
```typescript
class AppComponent extends iUnsubscribeDestroy implements OnInit{
  constructor(public router: Router){
    super();
  }
  ngOnInit(): void {
    TokenManagerService.listenerStartRefreshToken().pipe(takeUntil(this._unsub)).subscribe(val=>{
      // ¿ Complete refresh token ?
      // Yes: TokenManagerService.completeRefreshToken();
      // No: Logout
    })
    TokenManagerService.listenerTokenLost().pipe(takeUntil(this._unsub)).subscribe(val=>{
      this.router.navigate(['/']);
    })
  }
}
```
