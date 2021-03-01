import {Component, OnInit} from '@angular/core';
import {MainService} from '../main.service';
import {SocketService} from '../service/socket.service';
import {ChartType, ChartOptions} from 'chart.js';

import {Socket} from 'ngx-socket-io';
import {SingleDataSet} from "ng2-charts";
import {Router} from "@angular/router";
import {ToasterService} from "../service/toaster.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  clusterlist: any;
  logeventlist: any;
  totalCounts: any = {};
  customerName;
  pieChartLabels: any[] = [['Gold', 'Nodes:0'], ['Silver', 'Nodes:0'], ['Bronze', 'Nodes:0']];
  pieChartData: SingleDataSet = [0, 0, 0];
  pieChartType: ChartType = 'pie';
  pieChartOptions: ChartOptions = {
    responsive: true,
  };
  pieChartColors = [
    {backgroundColor: ["#d48538", "#ebebeb", "#d4af37"]},
    {borderColor: ["#d48538", "#ebebeb", "#d4af37"]}];

  constructor(private mainservice: MainService,
              private socket: Socket,
              private socketService: SocketService,
              private router: Router,
              private toasterService: ToasterService) {
  }

  ngOnInit() {

    const socket = this.socketService.newconnection();
    this.socketService.connectionIsAlive(socket);
    this.socketService.yesConnectionIsAlive(socket,function (data) {
      console.log('yes Connection Is Alive data', data)
    });
    const that = this;
    const accessToken = localStorage.getItem('token');
    this.customerName = localStorage.getItem('customer_name');
    console.log('accessToken', accessToken);
    if (!accessToken) {
      this.router.navigate(['/login']);
    } else {
      this.mainservice.getUnsecCluster()
        .subscribe(response => {
          this.clusterlist = response;
          console.log("resp", response);
        }, error => {
          console.log('eerrrr', error.message);
          console.log('eerrrr', error);
          if (error.status === 401) {
            this.gotoLogin();
            this.toasterService.showError(error.statusText);
          } else {
            this.toasterService.showError(error.message);
          }
        });
      this.mainservice.getlogevent()
        .subscribe(response => {
          this.logeventlist = response;
          console.log("respnew", this.logeventlist);
        }, error => {
          if (error.status === 401) {
            this.gotoLogin();
            this.toasterService.showError(error.statusText);
          } else {
            this.toasterService.showError(error.message);
          }
        })
      this.mainservice.getTotalResource().subscribe((res) => {
        this.totalCounts = res;
      }, error => {
        if (error.status === 401) {
          this.gotoLogin();
          this.toasterService.showError(error.statusText);
        } else {
          this.toasterService.showError(error.message);
        }
      });
      this.mainservice.getTotalList().subscribe((res) => {
        console.log('response', res);
        this.pieChartLabels = [['Gold', 'Nodes:' + res.Gold.TotalNodes], ['Silver', 'Nodes:' + res.Silver.TotalNodes],
          ['Bronze', 'Nodes:' + res.Bronze.TotalNodes]];
        this.pieChartData = [res.Gold.Totalstack, res.Silver.Totalstack, res.Bronze.Totalstack];
      }, error => {
        if (error.status === 401) {
          this.gotoLogin();
          this.toasterService.showError(error.statusText);
        } else {
          this.toasterService.showError(error.message);
        }
      });
      this.socketService.logs(socket, function (data) {
        console.log('socket logs', data);
        that.logeventlist = data;
      });
      this.socketService.totals(socket, function (data) {
        console.log('socket totals', data);
        that.totalCounts = data;
      });
      this.socketService.list(socket, function (res) {
        console.log('socket list', res);
        that.pieChartLabels = [['Gold', 'Nodes:' + res.Gold.TotalNodes], ['Silver', 'Nodes:' + res.Silver.TotalNodes],
          ['Bronze', 'Nodes:' + res.Bronze.TotalNodes]];
        that.pieChartData = [res.Gold.Totalstack, res.Silver.Totalstack, res.Bronze.Totalstack];
        console.log('=======================that.pieChartData', that.pieChartData);
      });
      this.socketService.unseccluster(socket, function (data) {
        console.log('socket unseccluster', data);
        that.clusterlist = data;
      });
    }
  }

  onChartClick(e) {
    if (e.active.length > 0) {
      const chart = e.active[0]._chart;
      const activePoints = chart.getElementAtEvent(e.event);
      if ( activePoints.length > 0) {
        // get the internal index of slice in pie chart
        const clickedElementIndex = activePoints[0]._index;
        const label = chart.data.labels[clickedElementIndex];
        // get value by index
        const value = chart.data.datasets[0].data[clickedElementIndex];
        console.log('label', label);
        this.router.navigate(['/cluster'], {queryParams: {stack: label[0]}});
      }
    }
  }

  gotoLogin() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
