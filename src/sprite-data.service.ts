import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { of } from 'rxjs/observable/of';
var Spritesmith = require('spritesmith');
import { IpcService } from './ipc.service.ts';


@Injectable({
  providedIn:'root'
})
export class SpriteDataService {
  public spriteConfig:Configurations = {
    framerate : 24;
    layout : "left-right";
    numberOfImagesPerSprite : 50;
    spacing : 20;
    fileType : "png";
    animationPrefix : "anim";
  };
  public layoutArray = ["top-down","left-right","diagonal","alt-diagonal","binary-tree"];
  public progress = 0;
  isProgressBarOpen = false;
  public spriteData = new Subject<Object>();
  spriteDataObservable = this.spriteData.asObservable();
  filesArray = [];
  constructor(private ipcService:IpcService){};

  public getSpriteData(filesArray:Object):Observable<Object> {
    if(!this.isProgressBarOpen) {
      console.log("Applying data : ",this.spriteConfig);
      this.ipcService.send("open-progress-bar",filesArray.length/this.spriteConfig.numberOfImagesPerSprite);
      this.isProgressBarOpen = true;
    }
    let self = this;
    let files = filesArray.splice(0,this.spriteConfig.numberOfImagesPerSprite - 1);
    Spritesmith.run({src: files,algorithm: this.spriteConfig.layout}, function handleResult (err, result) {
      if (err) console.log("run error ",err);
      self.spriteData.next(result);
      console.log("progress",self.progress++);
      self.ipcService.send("progress",self.progress);
      if( filesArray.length ) self.getSpriteData(filesArray);
      else {
        self.spriteData.complete();
        //self.ipcService.send("close-progress-bar");
        self.isProgressBarOpen = false;
        self.progress = 0;
      }
      return;
    });
  }
}
