import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ClusterService {


  api = environment.api;

  constructor(private http: HttpClient) {
  }

  getworkloadcomplianceReport(clusterName, customerId) {
    return this.http.get<any>(this.api + '/getworkloadcompliancereport/' + clusterName + '/' + customerId);
  }

  getClusterComplianceReport(clusterName, customerId) {
    return this.http.get<any>(this.api + '/getclustercompliancereport/' + clusterName + '/' + customerId);
  }

  getScanImageComplianceReport(clusterName, customerId) {
    return this.http.get<any>(this.api + '/getimgscancompliancereport/' + clusterName + '/' + customerId);
  }

  getAppComplianceReport(clusterName, customerId) {
    return this.http.get<any>(this.api + '/getappcompliancereport/' + clusterName + '/' + customerId);
  }
}
