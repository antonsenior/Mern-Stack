import {Component, OnInit} from '@angular/core';
import {ClusterService} from '../service/cluster.service';
import {SingleDataSet} from "ng2-charts";
import {ChartOptions, ChartType} from "chart.js";

@Component({
  selector: 'app-cluster2',
  templateUrl: './cluster2.component.html',
  styleUrls: ['./cluster2.component.css']
})
export class Cluster2Component implements OnInit {

  clusterData: any = {};
  customerData: any = {};
  complianceScore: any = 0;
  lastScanValue;
  workLoadData: any = [];
  dropdown: any = [];
  keys: any = [];
  pieChartLabels: any[] = [['Pass'], ['Info'], ['Warn'], ['Fail']];
  pieChartData: SingleDataSet = [1, 1, 1, 1];
  pieChartType: ChartType = 'pie';
  pieChartOptions: ChartOptions = {
    responsive: true,
  };
  pieChartColors = [
    {backgroundColor: ["#8cc051", "#d4ae37", "#d48538", '#e62335']},
    {borderColor: ["#8cc051", "#d4ae37", "#d48538", '#e62335']}];
  setting = {
    element: {
      dynamicDownload: null as HTMLElement
    }
  }
  reportData: any = '';

  constructor(private clusterService: ClusterService) {
  }

  ngOnInit() {
    this.getClusterComplianceData(localStorage.getItem('clusterName'), localStorage.getItem('customer_id'));
  }

  getClusterComplianceData(Cluster, customer) {
    this.clusterService.getClusterComplianceReport(Cluster, customer)
      .subscribe((res) => {
        console.log('res', res);
        this.clusterData = res.clusterData;
        this.customerData = res.customerData;
        this.workLoadData = JSON.parse(res.ReportData[0].summary_json);
        this.reportData = res.ReportData[0].raw_report;
        this.complianceScore = ((Number((this.workLoadData.All.P ? this.workLoadData.All.P : 0)) * 100) / (Number((this.workLoadData.All.F ? this.workLoadData.All.F : 0)) + Number(this.workLoadData.All.P ? this.workLoadData.All.P : 0) + Number((this.workLoadData.All.W ? this.workLoadData.All.W : 0)))).toFixed(2);;
        this.lastScanValue = res.ReportData[0].timestamp;
        this.pieChartData = [this.workLoadData['All'].P, this.workLoadData['All'].I, this.workLoadData['All'].W, this.workLoadData['All'].F];
        this.dropdown = Object.keys(JSON.parse(res.ReportData[0].summary_json));
      }, (err) => {
        console.log('err', err);
      });
  }

  onChange(data) {
    console.log('data', data);
    console.log('data', data.target.value);
    console.log('data', this.workLoadData[data.target.value]);
    this.complianceScore = (Number(this.workLoadData[data.target.value].P ? this.workLoadData[data.target.value].P : 0) * 100 / (Number(this.workLoadData[data.target.value].P ? this.workLoadData[data.target.value].P : 0) + Number(this.workLoadData[data.target.value].F ? this.workLoadData[data.target.value].F : 0) + Number(this.workLoadData[data.target.value].W ? this.workLoadData[data.target.value].W : 0))).toFixed(2);;
    this.pieChartData = [(this.workLoadData[data.target.value].P ? this.workLoadData[data.target.value].P : 0), (this.workLoadData[data.target.value].I ? this.workLoadData[data.target.value].I : 0), (this.workLoadData[data.target.value].W ? this.workLoadData[data.target.value].W : 0), (this.workLoadData[data.target.value].F ? this.workLoadData[data.target.value].F : 0)];
    console.log(' this.complianceScore', this.complianceScore);
    console.log('this.pieChartData', this.pieChartData);
  }

  dynamicDownloadTxt() {
    // this.fakeValidateUserData().subscribe((res) => {
    this.dyanmicDownloadByHtmlTag({
      fileName: 'clusterComplianceReport',
      text: this.reportData
    });
    // });

  }

  dyanmicDownloadByHtmlTag(arg: {
    fileName: string,
    text: string
  }) {
    if (!this.setting.element.dynamicDownload) {
      this.setting.element.dynamicDownload = document.createElement('a');
    }
    const element = this.setting.element.dynamicDownload;
    const fileType = arg.fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(arg.text)}`);
    element.setAttribute('download', arg.fileName);

    const event = new MouseEvent("click");
    element.dispatchEvent(event);
  }

}
