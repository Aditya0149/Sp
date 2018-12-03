//angular modules
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { of } from 'rxjs/observable/of';

// app modules
import { IpcService } from './ipc.service.ts';

// node modules
const Spritesmith = require('spritesmith');
const path = require("path");
const fs = require("fs");
const jsonFile = require("jsonfile");

@Injectable({ })
export class SpriteDataService {
  public spriteConfig = {
    framerate : 24;
    layout : "left-right";
    maxArea : 3000000;
    spacing : 1;
    fileType : "png";
    animationPrefix : "anim";
  };
  public layoutArray = ["top-down","left-right","diagonal","alt-diagonal","binary-tree"];
  public progress = 0;
  private isProgressBarOpen = false;
  public spriteData = new Subject<Object>();
  private spriteDataObservable = this.spriteData.asObservable();
  private filesArray = [];
  private imageSize = {};
  private completeCalled = false;
  private areaPerImage = 0;
  private numberOfImagesPerSprite = 10;

  constructor(private ipcService:IpcService){};

  public getSpriteData(filesArray:Object,areaPerImage):Observable<Object> {
    if(!this.isProgressBarOpen) {
      this.numberOfImagesPerSprite = Math.floor(this.spriteConfig.maxArea/areaPerImage);
      this.ipcService.send("open-progress-bar",filesArray.length/this.numberOfImagesPerSprite);
      this.isProgressBarOpen = true;
    }
    let files = filesArray.splice(0,this.numberOfImagesPerSprite);
    Spritesmith.run({ src: files, algorithm: this.spriteConfig.layout, algorithmOpts: {sort: false},padding: this.spriteConfig.spacing }, (err, result) => {
      if (err) console.log("run error ",err);
      this.spriteData.next(result);

      this.progress = this.progress + 1;
      this.ipcService.send("progress",this.progress);
      if( filesArray.length ) this.getSpriteData(filesArray,areaPerImage);
      else {
          this.spriteData.complete();
          this.isProgressBarOpen = false;
          this.progress = 0;
          this.spriteData = new Subject<Object>();
          this.spriteDataObservable = this.spriteData.asObservable();
      }
    });
  }

}
