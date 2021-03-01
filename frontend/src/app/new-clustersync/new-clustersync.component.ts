import {Component, OnInit} from '@angular/core';
import {MainService} from "../main.service";
import {HttpClient} from "@angular/common/http";
import {Location} from "@angular/common";
import {Socket} from "ngx-socket-io";
import {SocketService} from "../service/socket.service";
import {UserService} from "../service/user.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-new-clustersync',
  templateUrl: './new-clustersync.component.html',
  styleUrls: ['./new-clustersync.component.css']
})
export class NewClustersyncComponent implements OnInit {
  clusterlist: any = [];
  stacklist: any = [
    {name: "bronze_stack", value: 'Bronze Stack'},
    {name: "silver_stack", value: 'Silver Stack'},
    {name: "gold_stack", value: 'Gold Stack'}];
  clusterData: any = {};
  display = 'none';
  viewDisplay = 'none';
  clusterDisplay = 'none';
  selectedStack: any = {};
  btncolor = false;
  fileContent = '';
  showProgress = false;
  selectedCluster;
  customerId;
abc;
  searchText = '';

  constructor(private mainservice: MainService,
              private http: HttpClient,
              private location: Location,
              private socket: Socket,
              private socketService: SocketService,
              private userService: UserService,
              private activatRoute: ActivatedRoute,
              private router: Router) {

  }

  ngOnInit() {
    this.activatRoute.queryParams.subscribe((data) => {
      console.log('data.stack', data.stack);
      this.selectedCluster = data.stack;
      this.getAllCluster();
    });
    // const socket = this.socketService.newconnection();
    this.socketService.connectionIsAlive(this.socket);
    this.socketService.yesConnectionIsAlive(this.socket, function (data) {
      // console.log('yes Connection Is Alive data', data)
    });
    this.http.get('assets/file/deploy-cnox', {responseType: 'text'})
      .subscribe(data => {
        this.fileContent = data;
      });

    const that = this;
    this.socketService.cluster(this.socket, function (data) {
      console.log('socket cluster', data);
      data.forEach((x) => {
        x.checked = false;
      });
      console.log('========== that.selectedCluster ============', that.selectedCluster);
      if (that.selectedCluster === undefined || that.selectedCluster === '') {
        that.clusterlist = data;
      }

      console.log('that.cluster', that.clusterlist);

    });

    this.customerId = localStorage.getItem('customer_id');
    this.socketService.updateCLuster(this.socket, function (data) {
      console.log('update-cluster', data);
      that.clusterlist.filter((x) => {
        if (x.cluster_name === data.cluster_name) {
          x.showProgress = true;
          if (x.barWidth) {
            if ((x.barWidth + data.percentage) < 101) {
              x.barWidth += data.percentage;
            }
          } else {
            x.barWidth = data.percentage;
          }
        }
      });
    });
  }

  getClearAllCluster() {
    console.log('in clear');
    this.selectedCluster = '';
    this.getAllCluster();
    this.location.replaceState('cluster');
  }

  getAllCluster() {

    console.log('this.selectedCluster', this.selectedCluster);
    this.mainservice.getCluster()
      .subscribe(response => {
        this.clusterlist = [];
        if (this.selectedCluster === 'Silver') {
          response.filter((x) => {
            if (x.cnox_stack === 'silver_stack') {
              this.clusterlist.push(x);
            }
            console.log('silver', this.clusterlist);
          });
        } else if (this.selectedCluster === 'Bronze') {
          response.filter((x) => {
            if (x.cnox_stack === 'bronze_stack') {
              this.clusterlist.push(x);
            }
            console.log('oooooooooooooooo', this.clusterlist);
          });
        } else if (this.selectedCluster === 'Gold') {
          response.filter((x) => {
            if (x.cnox_stack === 'gold_stack') {
              this.clusterlist.push(x);
            }
            console.log('gold_stack', this.clusterlist);
          });
        } else {
          response.forEach((x) => {
            x.checked = false;
          });
          this.clusterlist = response;
          console.log('yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', this.clusterlist);
        }
      });
  }

  openModal() {
    let length = Object.keys(this.clusterData).length;
    if (length > 0) {
      this.display = 'block';
      this.btncolor = true;
    } else {
      alert('Please select any one cluster');
      this.display = 'none';
      this.btncolor = false;

    }
  }

  openView() {
    let length = Object.keys(this.clusterData).length;
    if (length > 0) {
      // this.viewDisplay = 'block';
      localStorage.setItem('clusterName', this.clusterData.cluster_name);
      this.router.navigate(['/cluster-1']);
    } else {
      alert('Please select any one cluster');
      this.viewDisplay = 'none';

    }
  }

  onStackUpdate() {
    this.display = 'none';
    console.log('selected stack',this.selectedStack);
    this.clusterlist.filter((x) => {
      if (x.cluster_name === this.clusterData.cluster_name) {
        x.showProgress = true;
        x.barWidth = 0;
      }
    });
    this.mainservice.updateStack(this.clusterData.cnox_engine_url, this.clusterData.cluster_name, this.selectedStack).subscribe((res) => {
      console.log('stackrespone', res);
      // this.showProgress = true;
      this.clusterlist.filter((x) => {
        if (x.cluster_name === this.clusterData.cluster_name) {
          x.showProgress = true;
          x.barWidth = 0;
        }
      });
      if (this.clusterData.cnox_stack === "unsecured") {
        // alert(this.clusterData.cluster_name + " is secured.");
      }
    }, error => {
      /*this.clusterlist.filter((x) => {
        if (x.cluster_name === this.clusterData.cluster_name) {
          x.showProgress = true;
          x.barWidth = 20;
        }
      });*/
    });
  }

  closeView() {
    this.viewDisplay = 'none';
    this.display = 'none';

  }

  onClusterChange(data, index) {
    console.log('clusterData', data);
    localStorage.setItem('monitor_url', data.monitor_url);
    localStorage.setItem('scanner_url', data.scanner_url);
    this.clusterData = data;
    if (this.clusterData.cnox_stack !== "unsecured" && this.clusterData.cnox_stack !== '') {
      this.btncolor = true;
    } else {
      this.btncolor = false;
    }
    this.clusterlist.forEach((x, i) => {
      if (index !== i) {
        x.checked = false;
      } else if (index === i && x.checked === false) {
        this.clusterData = {};
      }
    });
  }

  onStackChange(event) {
    alert(this.selectedStack);
    // this.selectedStack = event.target.value;
  }

  getUnsecuredCluster() {
    this.mainservice.getUnsecCluster()
      .subscribe(response => {
        response.forEach((x) => {
          x.checked = false;
        });
        this.clusterlist = response;
      });
  }

  deleteStack() {
    this.clusterlist.filter((x) => {
      if (x.cluster_name === this.clusterData.cluster_name) {
        x.cnox_stack = "Stack delete in progress";
      }
    });


    this.mainservice.deleteStack(this.clusterData.cnox_engine_url, this.clusterData.cluster_name, this.customerId)
      .subscribe((res) => {
        console.log('res', res);
        let user = JSON.parse(localStorage.getItem('user'));
        const json = {
          log_string: "Delete " + this.clusterData.cluster_name + " by " + user.username,
          customer_id: localStorage.getItem('customer_id'),
          cluster_name: this.clusterData.cluster_name,
          priority: "INFO"
        };
        this.userService.addLog(json)
          .subscribe((response) => {
              console.log('addLog response', response);
              this.getAllCluster();
            },
            error => {
              console.log('addLog err', error);
              this.getAllCluster();
            });

        // let stack = {
        //   'cnox_stack': "unsecured"
        // };
        // this.mainservice.changeStack(this.clusterData.cluster_name, stack)
        //   .subscribe((data) => {
        //     this.getAllCluster();
        //   })
      });
  }

  openClusterModal() {
    this.clusterDisplay = 'block';
  }

  onCloseCluster() {
    this.clusterDisplay = 'none';
  }

  copyText(val: string) {
    console.log('text', val)
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}
