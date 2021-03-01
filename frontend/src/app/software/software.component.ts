import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ClusterService} from "../service/cluster.service";
import {SocketService} from "../service/socket.service";
import {Socket} from "ngx-socket-io";
import {Router} from "@angular/router";

import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';

@Component({
  selector: 'app-software',
  templateUrl: './software.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./software.component.css']
})

export class SoftwareComponent implements OnInit {
  @ViewChild('myTable', {static: false}) table: any;
  clusterData: any = {};
  ReportTotal: any = {
    Critical: 0, High: 0, Medium: 0, Low: 0, Negligible: 0, Unknown: 0
  };
  customerData: any = {};
  sevData: any = [];
  isData: any = false;
  isSevData: any = false;
  newUpdate: any = false;
  src: any = [];
  newSrc: any = [];
  scannerUrl: any = '';
  lastScanValue: any = +new Date();
  totalSize;
  pageSize = 5;

  DataSourceStorage: any = [];
  Keys = [];
  checkKeys = [];

  imageKeys = [];
  imageCheckKeys = [];
  imageDataSourceStorage: any = [];

  constructor(private clusterService: ClusterService,
              private socketService: SocketService,
              private socket: Socket,
              private router: Router) {
  }

  ngOnInit() {
    // const socket = this.socketService.newconnection();
    this.socketService.connectionIsAlive(this.socket);
    this.socketService.yesConnectionIsAlive(this.socket,function (data) {
      // console.log('yes Connection Is Alive data', data)
    });
    this.scannerUrl = localStorage.getItem('scanner_url');
    console.log('scannerUrl', this.scannerUrl);
    this.getScanImageData(localStorage.getItem('clusterName'), localStorage.getItem('customer_id'));
    this.getappComplianceData(localStorage.getItem('clusterName'), localStorage.getItem('customer_id'));
    const that = this;
    this.socketService.getAppComplianceReport(this.socket, function (data) {
      console.log('dataaaaaaaaaaaaaaa', data);
      const jsonData = JSON.parse(data.summary_json);
      that.ReportTotal = jsonData.severity_count;
      that.src = jsonData.report_by_image;
      that.imageCheckKeys = [];
      that.imageKeys = [];
      (jsonData.report_by_image).filter((y) => {
        if ((that.imageCheckKeys).includes(y.Image) === false) {
          that.imageCheckKeys.push(y.Image);
          that.imageKeys.push({Severity: y.Severity, Vulnerability: y.Vulnerability, Image: y.Image});
        }
      });
      that.sevData = jsonData.report_by_severity;
      that.checkKeys = [];
      that.Keys = [];
      (jsonData.report_by_severity).filter((x) => {
        if ((that.checkKeys).includes(x.Severity) === false) {
          that.checkKeys.push(x.Severity);
          if (x.Severity === 'Critical') {
            that.Keys[0] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          } else if (x.Severity === 'High') {
            that.Keys[1] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          } else if (x.Severity === 'Medium') {
            that.Keys[2] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          } else if (x.Severity === 'Low') {
            that.Keys[3] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          } else if (x.Severity === 'Negligible') {
            that.Keys[4] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          } else if (x.Severity === 'Unknown') {
            that.Keys[5] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
          }
        }
      });
      that.lastScanValue = data.timestamp;
      that.isSevData = true;
      that.isData = true;
      that.newUpdate = true;
    });
  }

  getTasks(key) {
    let item = this.DataSourceStorage.find((i) => i.key === key);
    if (!item) {
      item = {
        key: key,
        dataSourceInstance: new DataSource({
          store: new ArrayStore({
            data: this.sevData,
            key: "Severity"
          }),
          filter: ["Severity", "=", key]
        })
      };
      this.DataSourceStorage.push(item);
    }
    return item.dataSourceInstance;
  }

  getImage(key) {
    let imageItem = this.imageDataSourceStorage.find((i) => i.key === key);
    if (!imageItem) {
      imageItem = {
        key: key,
        dataSourceInstance1: new DataSource({
          store: new ArrayStore({
            data: this.src,
            key: "Image"
          }),
          filter: ["Image", "=", key]
        })
      };
      this.imageDataSourceStorage.push(imageItem);
    }
    return imageItem.dataSourceInstance1;
  }

  getScanImageData(Cluster, customer) {
    this.clusterService.getScanImageComplianceReport(Cluster, customer)
      .subscribe((res) => {
        console.log('getScanImageData res', res);
        console.log('res.clusterData', res.clusterData);
        console.log('res.clusterData.scannerUrl', res.clusterData.scanner_url);
        this.clusterData = res.clusterData;
        this.customerData = res.customerData;
        // this.scannerUrl = res.clusterData.scanner_url;
        if (res.ReportData[0].img.length > 0) {
          console.log('res.ReportData[0].img', res.ReportData[0].img);
          (res.ReportData[0].img).filter((x) => {
            if ((this.imageCheckKeys).includes(x) === false) {
              this.imageCheckKeys.push(x);
              this.imageKeys.push({Image: x, Vulnerability: '', Severity: ''});
            }
            // this.src.push({Image: x, Vulnerability: '', Severity: ''});
          });
          this.isData = true;
        }
      }, (err) => {
        console.log('err', err);
      });
  }

  getappComplianceData(Cluster, customer) {
    this.clusterService.getAppComplianceReport(Cluster, customer)
      .subscribe((res) => {
        console.log('app compliance res', res);
        console.log('app compliance this.customerData', res.clusterData);
        console.log('app compliance  this.scannerUrl', res.clusterData.scanner_url);
        this.clusterData = res.clusterData;
        this.customerData = res.customerData;
        if (res.ReportData[0].summary_json) {
          const jsonData = JSON.parse(res.ReportData[0].summary_json);
          console.log('jsonData.report_by_severity', jsonData.report_by_severity);
          console.log('jsonData.report_by_image', jsonData.report_by_image);
          this.ReportTotal = jsonData.severity_count;
          this.imageKeys = [];
          this.imageCheckKeys = [];
          this.src = jsonData.report_by_image;
          (jsonData.report_by_image).filter((y) => {
            if ((this.imageCheckKeys).includes(y.Image) === false) {
              this.imageCheckKeys.push(y.Image);
              this.imageKeys.push({Severity: y.Severity, Vulnerability: y.Vulnerability, Image: y.Image});
            }
          });

          this.sevData = jsonData.report_by_severity;
          (jsonData.report_by_severity).filter((x) => {
            if ((this.checkKeys).includes(x.Severity) === false) {
              this.checkKeys.push(x.Severity);
              if (x.Severity === 'Critical') {
                this.Keys[0] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              } else if (x.Severity === 'High') {
                this.Keys[1] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              } else if (x.Severity === 'Medium') {
                this.Keys[2] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              } else if (x.Severity === 'Low') {
                this.Keys[3] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              } else if (x.Severity === 'Negligible') {
                this.Keys[4] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              } else if (x.Severity === 'Unknown') {
                this.Keys[5] = {Severity: x.Severity, Vulnerability: x.Vulnerability, Image: x.Image};
              }
            }
          });
          console.log('keys', this.Keys);

          this.lastScanValue = res.ReportData[0].timestamp;
          this.isSevData = true;
          this.newUpdate = true;
          this.totalSize = this.src.length;
        }
      }, (err) => {
        console.log('err', err);
      });
  }

  onScannerURL() {
    this.router.navigate([]).then(result => {
      window.open(this.scannerUrl, '_blank');
    });
  }

}
