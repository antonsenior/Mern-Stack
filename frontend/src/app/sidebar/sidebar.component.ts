import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  monitorUrl;
  constructor() { }

  ngOnInit() {
    this.monitorUrl = localStorage.getItem('monitor_url');
    console.log('monitor_url', this.monitorUrl);
  }

}
