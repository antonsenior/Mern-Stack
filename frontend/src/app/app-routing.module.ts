import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ClustersyncComponent} from './clustersync/clustersync.component';
import {PolicyComponent} from './policy/policy.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {Cluster1Component} from './cluster1/cluster1.component';
import {Cluster2Component} from "./cluster2/cluster2.component";
import {SoftwareComponent} from "./software/software.component";
import {NewClustersyncComponent} from "./new-clustersync/new-clustersync.component";
import {NewLoginComponent} from "./new-login/new-login.component";
import {AlertComponent} from "./alert/alert.component";


const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'cluster', component: ClustersyncComponent},
  {path: 'policy', component: PolicyComponent},
  {path: 'cluster-1', component: Cluster1Component},
  {path: 'cluster-2', component: Cluster2Component},
  {path: 'software', component: SoftwareComponent},
  {path: 'newCluster', component: NewClustersyncComponent},
  {path: 'newlogin', component: NewLoginComponent},
  {path: 'alert', component: AlertComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
