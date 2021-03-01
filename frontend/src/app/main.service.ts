import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MainService {
  newapi = environment.api;
  sharedData: any = {};

  constructor(private http: HttpClient) {
  }

  getCluster() {
    return this.http.get<any>(this.newapi + '/cluster');
  }

  getUnsecCluster() {
    return this.http.get<any>(this.newapi + '/unseccluster');
  }

  getlogevent() {
    return this.http.get<any>(this.newapi + '/log');
  }

  getTotalResource() {
    return this.http.get<any>(this.newapi + '/totals');
  }

  getTotalList() {
    return this.http.get<any>(this.newapi + '/lists');
  }

  updateStack(cnoxEngineUrl, clustername, data) {
    return this.http.post<any>(cnoxEngineUrl + '/cluster/' + clustername + '/cnox_stack', data);
  }

  deleteStack(cnoxEngineUrl, clustername, customerId) {
    return this.http.delete(cnoxEngineUrl + '/cluster/' + clustername + '/cnox_stack/' + customerId);
  }

  addPolicy(data) {
    return this.http.post(this.newapi + '/policy', data);
  }

}

