import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { of } from 'rxjs/observable/of';
var Spritesmith = require('spritesmith');
import { IpcService } from './ipc.service.ts';
var path = require("path");
var jsonFile = require("jsonfile");

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


  writeJsonFile(allSpritesArray,destinationPath):Object{
    console.log(allSpritesArray);
    //allSpritesArray.sort(this.sortAlphanumeric);
    let outputJsonObject = {};
    outputJsonObject.frames = [];
    outputJsonObject.sprite_sheets = [];
    outputJsonObject.animations = [{}];
    outputJsonObject.animations[0].frames = [];
    let prefix = this.spriteConfig.animationPrefix;
    let frameRate = this.spriteConfig.framerate;

    allSpritesArray.forEach( ( spriteData, index ) => {
      let coordinates = spriteData.coordinates;
      let properties = spriteData.properties;
      let framesArray = [];
      Object.keys(coordinates).forEach( key => {
        let ip = coordinates[key];
        let keyName = path.parse(""+key).name + "." + this.spriteConfig.fileType;
        ip.name = keyName;
        ip.sprite_x = ip.x;
        delete(ip.x);
        ip.sprite_y = ip.y;
        delete(ip.y);
        ip.sprite_index = index;
        ip.colorRect = {
          "width": Math.round( ip.width ),
          "y": Math.round( ip.sprite_x ),
          "height": Math.round( ip.height ),
          "x": Math.round( ip.sprite_x )
        }
        outputJsonObject.frames.push(ip);
        outputJsonObject.animations[0].frames.push({frame : keyName});
      });
      outputJsonObject.sprite_sheets.push(properties);

    });

    outputJsonObject.name = prefix;
    outputJsonObject.info = {
      "calc_type": "horizontal",
      "min_height": 0,
      "max_area": 2000000,
      "max_height": -1,
      "sort": "name",
      "max_width": -1,
      "min_width": 0,
      "spacing": 1
    };
    outputJsonObject.animations[0].fps = frameRate;
    outputJsonObject.animations[0].name = prefix;
    jsonFile.writeFileSync(path.join(destinationPath,this.spriteConfig.animationPrefix)+".json",outputJsonObject);
    alert("JSON file created");
  }

  private sortAlphanumeric(a,b){
    let aN = parseInt( a.slice(a.indexOf("(")).replace("."+ this.spriteConfig.fileType,"").slice(1).slice(0,-1) );
    let bN = parseInt( b.slice(a.indexOf("(")).replace("."+ this.spriteConfig.fileType,"").slice(1).slice(0,-1) );
    if ( aN === bN ) return 0;
    return aN > bN ? 1 : -1;
  }

}
