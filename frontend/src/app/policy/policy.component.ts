import { Component, OnInit } from '@angular/core';
import {MainService} from "../main.service";
import {UserService} from "../service/user.service";

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {

  selectedStack = '';
  policiesField: any = {};
  gpoliciesField: any = {};
  cnoxUrl = 'http://12345.us-west2.elb.amazonaws.com:8888'
  constructor(
    private mainservice: MainService,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.policiesField.stack = 'bronze_stack';
    this.gpoliciesField.security_resource = 'efficient';
    this.policiesField.upgrade = 'true';
    this.policiesField.dashboard = 'grafana';
    this.policiesField.alerting = 'false';
    this.policiesField.ha = 'true';
    this.policiesField.storageSize = '512Mb';
    this.policiesField.imageRegistry = 'dockerHub';
    this.policiesField.frequency = 'hourly';
    this.gpoliciesField.compliance_frequency = 'hourly';
    this.policiesField.externalDb = 'true';
    this.policiesField.storage = '1Gb';
  }

  onSubmit() {
    console.log('policiesField', this.policiesField, this.selectedStack);
  }

  onGeneralSubmit() {
    let data = {
      customer_id : localStorage.getItem('customer_id'),
      policy_body : this.gpoliciesField
    };
    console.log('data', data);
    this.mainservice.addPolicy(data)
      .subscribe((res) => {
        console.log('res', res);
        let user = JSON.parse(localStorage.getItem('user'));
        const json = {
          log_string: "Policies saved by " + user.username,
          customer_id: localStorage.getItem('customer_id'),
          priority: "INFO"
        };
        this.userService.addLog(json)
          .subscribe((response) => {
              console.log('addLog response', response);
            },
            error => {
              console.log('addLog err', error);
            });
      }, error => {
        console.log('error', error);
      });
  }

}
