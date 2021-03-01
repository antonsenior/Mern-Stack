import {Component, OnInit} from '@angular/core';
import {ClusterService} from '../service/cluster.service';
import {SingleDataSet} from "ng2-charts";
import {ChartOptions, ChartType} from "chart.js";
import * as _ from 'lodash';

@Component({
  selector: 'app-cluster1',
  templateUrl: './cluster1.component.html',
  styleUrls: ['./cluster1.component.scss']
})
export class Cluster1Component implements OnInit {

  clusterData: any = {};
  customerData: any = {};
  workLoadData: any = [];
  recommedationData: any = [];
  lastScanValue;
  keys: any = [];
  pieChartLabels: any[] = [['Info'], ['Warn'], ['Error']];
  pieChartData: SingleDataSet = [1, 1, 1];
  pieChartType: ChartType = 'pie';
  pieChartOptions: ChartOptions = {
    responsive: true,
  };
  pieChartColors = [
    {backgroundColor: ["#d4ae37", "#d48538", "#e62335"]},
    {borderColor: ["#d4ae37", "#d48538", "#e62335"]}];

  constructor(private clusterService: ClusterService) {
  }

  ngOnInit() {
    this.getworkLoadData(localStorage.getItem('clusterName'), localStorage.getItem('customer_id'));
  }

  getworkLoadData(Cluster, customer) {
    this.clusterService.getworkloadcomplianceReport(Cluster, customer)
      .subscribe((res) => {
        console.log('res', res);
        this.clusterData = res.clusterData;
        this.customerData = res.customerData;
        this.workLoadData = JSON.parse(res.ReportData[0].summary_json);
        this.lastScanValue = (res.ReportData[0].timestamp);
        let json = [];
        Object.keys(JSON.parse(res.ReportData[0].summary_json)).filter((x) => {
          // console.log('this.workLoadData[]', x, this.workLoadData[x]);
          this.workLoadData[x]['name'] = '';
          this.workLoadData[x]['name'] = x;
          json.push(this.workLoadData[x]);
        });
        this.recommedationData = JSON.parse(res.ReportData[0].recommend_json);

        const newJson = _.sortBy(Object.values(json), ['E']).reverse();
        newJson.filter((x) => {
          if (x.name !== 'all') {
            this.keys.push(x.name);
          } else {
            this.pieChartData = [this.workLoadData[x.name].I, this.workLoadData[x.name].W, this.workLoadData[x.name].E];
          }
        });
      }, (err) => {
        console.log('err', err);
      });
  }
}
