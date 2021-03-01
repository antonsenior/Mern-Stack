import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ClustersyncComponent} from './clustersync/clustersync.component';
import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
import {SocketIoModule, SocketIoConfig} from 'ngx-socket-io';
import {SocketService} from "./service/socket.service";
import {FormsModule} from "@angular/forms";
import {ChartsModule} from "ng2-charts";
import {NiceSelectModule} from "ng-nice-select";


import {environment} from "../environments/environment";
import {PolicyComponent} from './policy/policy.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ToastrModule} from "ngx-toastr";
import {JwtInterceptor} from './_helpers/jwt.interceptor';
import {Cluster1Component} from './cluster1/cluster1.component';
import {SidebarComponent} from './sidebar/sidebar.component';
import {Cluster2Component} from './cluster2/cluster2.component';
import {SoftwareComponent} from './software/software.component';
import {DxDataGridModule, DxTemplateModule} from "devextreme-angular";
// import {AutoLogoutService} from "./service/autoLogout.service";

import {FilterPipe} from "./service/filter.pipe";
import { NewClustersyncComponent } from './new-clustersync/new-clustersync.component';
import { NewHeaderComponent } from './new-header/new-header.component';
import { NewLoginComponent } from './new-login/new-login.component';
import { AlertComponent } from './alert/alert.component';

const config: SocketIoConfig = {url: environment.socketUri, options: {}};

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ClustersyncComponent,
    HeaderComponent,
    FooterComponent,
    PolicyComponent,
    LoginComponent,
    RegisterComponent,
    Cluster1Component,
    SidebarComponent,
    Cluster2Component,
    SoftwareComponent,
    FilterPipe,
    NewClustersyncComponent,
    NewHeaderComponent,
    NewLoginComponent,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    DxDataGridModule,
    DxTemplateModule,
    FormsModule,
    AppRoutingModule,
    ChartsModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    NiceSelectModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(),
  ],
  providers: [SocketService,
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule {
}
