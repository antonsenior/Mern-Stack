import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket) {
  }

  newconnection() {
    return this.socket;
  }

  connectionIsAlive(UserSocket){
    UserSocket.emit('pong', function (data) {
      console.log(data);
    });
  }

  yesConnectionIsAlive(UserSocket, cb){
    UserSocket.on('ping', function (data) {
      cb(data);
    });
  }

  logs(UserSocket, cb) {
    UserSocket.on('logs', function (data) {
      cb(data);
    });
  }

  totals(UserSocket, cb) {
    UserSocket.on('totals', function (data) {
      cb(data);
    });
  }

  list(UserSocket, cb) {
    UserSocket.on('list', function (data) {
      cb(data);
    });
  }

  unseccluster(UserSocket, cb) {
    UserSocket.on('unseccluster', function (data) {
      cb(data);
    });
  }

  cluster(UserSocket, cb) {
    UserSocket.on('cluster', function (data) {
      cb(data);
    });
  }

  updatecount(UserSocket, cb) {
    UserSocket.on('updatecount', function (data) {
      cb(data);
    });
  }

  updatescannerurl(UserSocket, cb) {
    UserSocket.on('updatescannerurl', function (data) {
      cb(data);
    });
  }

  updatemonitorurl(UserSocket, cb) {
    UserSocket.on('updatemonitorurl', function (data) {
      cb(data);
    });
  }

  updatecomplianceurl(UserSocket, cb) {
    UserSocket.on('updatecomplianceurl', function (data) {
      cb(data);
    });
  }

  updatecnoxstack(UserSocket, cb) {
    UserSocket.on('updatecnoxstack', function (data) {
      cb(data);
    });
  }

  updateCLuster(UserSocket, cb) {
    UserSocket.on('update-cluster', function (data) {
      cb(data);
    });
  }

  getAppComplianceReport(UserSocket, cb) {
    UserSocket.on('AppComplianceReport', function (data) {
      cb(data);
    });
  }

  login(name, password, cb) {
    const that = this;
    this.socket.emit('new user', [name, password], function (data, msg) {
      if (data) {
        cb(null, [data]);
      } else {
        cb(msg, null);
      }
    });
  }



  loadMessage(cb) {
    this.socket.on('load old msgs', function (data) {
      cb(data);
    });
  }

  findMessage(name, cb) {
    const that = this;
    this.socket.emit('find message', name);
    this.notification(function (notificationdata) {
      that.loadMessage(function (msgData) {
        cb([notificationdata, msgData]);
      });
    });
  }

  findLastMessage(name, cb) {
    const that = this;
    this.socket.emit('findLastMessage', name, function (err, messages) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, messages);
      }
    });
  }

  newmessage(cb) {
    this.socket.on('new message', function (msgdata) {
      cb(msgdata);
    });
  }

  notification(cb) {
    console.log('notification callback');
    this.socket.on('notification', function (users, message, activeUser) {
      cb([users, message, activeUser]);
    });
  }

  sendMessage(name, currentDate, cb) {
    this.socket.emit('send message', [name, currentDate], function (data) {
      console.log('err,data', data);
      if (data) {
        cb(data);
      }
    });
  }

  getOnlineUserList(cb) {
    this.socket.emit('getOnlineUser', function (data) {
      cb(data);
    });
  }
}
