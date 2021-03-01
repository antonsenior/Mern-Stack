import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {MainService} from "../main.service";
import {UserService} from "../service/user.service";
import {ToasterService} from "../service/toaster.service";

@Component({
  selector: 'app-new-login',
  templateUrl: './new-login.component.html',
  styleUrls: ['./new-login.component.css']
})
export class NewLoginComponent implements OnInit {
  user: any = {};

  constructor(private router: Router,
              private mainService: MainService,
              private userService: UserService,
              private toasterService: ToasterService) {
  }

  ngOnInit() {
    const accessToken = localStorage.getItem('token');
    console.log('accessToken', accessToken);
    if (!accessToken) {
      this.router.navigate(['/newlogin']);
    } else {
      // this.router.navigate(['/dashboard']);
      this.router.navigate(['/newCluster']);
    }
  }


  onSubmit() {
    this.userService.userLogin(this.user)
      .subscribe((res) => {
        console.log('loginRes', res);
        if (res.password) {
          localStorage.setItem('token', res.tokens.authToken);
          localStorage.setItem('user_id', res.user.user_id);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('customer_id', res.customer.customer_id);
          localStorage.setItem('customer_name', res.customer.name);
          this.toasterService.showSuccess('Login Successfully.');
          const json = {
            log_string: "User " + res.user.username + " logged in",
            customer_id: res.customer.customer_id,
            priority: "INFO"
          };
          this.userService.addLog(json)
            .subscribe((response) => {
                console.log('addLog response', response);
                this.router.navigate(['/dashboard']);
              },
              error => {
                console.log('addLog err', error);
              });
        } else {
          localStorage.setItem('username', res.user.username);
          localStorage.setItem('customer_id', res.user.customer_id);
          this.router.navigate(['/register']);
        }
      }, err => {
        console.log('loginRes', err);
        console.log('loginRes', err.error.message);
        const json = {
          log_string: "Login failed for user " + this.user.username,
          // customer_id: this.user.customer_id,
          priority: "WARN"
        };
        this.toasterService.showError(err.error.message);
        this.userService.addLog(json)
          .subscribe((response) => {
              console.log('addLog response', response);
            },
            error => {
              console.log('addLog err', error);
            });
      });
  }

  onForgetSubmit() {
    let data = {
      email: this.user.email
    };
    this.userService.forgetPassword(data)
      .subscribe((res) => {
      }, error => {
        this.toasterService.showError(error.error.message);
        console.log('error', error);
      });
  }


}
