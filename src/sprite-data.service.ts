import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { of } from 'rxjs/observable/of';
var Spritesmith = require('spritesmith');
import { IpcService } from './ipc.service.ts';
var path = require("path");
var fs = require("fs");
var jsonFile = require("jsonfile");

@Injectable({
  providedIn:'root'
})
export class SpriteDataService {
  public spriteConfig = {
    framerate : 24;
    layout : "left-right";
    numberOfImagesPerSprite : 10;
    spacing : 1;
    fileType : "png";
    animationPrefix : "anim";
  };
  public layoutArray = ["top-down","left-right","diagonal","alt-diagonal","binary-tree"];
  public progress = 0;
  isProgressBarOpen = false;
  public spriteData = new Subject<Object>();
  spriteDataObservable = this.spriteData.asObservable();
  filesArray = [];
  imageSize = {};


  constructor(private ipcService:IpcService){};

  public getSpriteData(filesArray:Object):Observable<Object> {
    if(!this.isProgressBarOpen) {
      console.log("Applying data : ",this.spriteConfig);
      this.ipcService.send("open-progress-bar",filesArray.length/this.spriteConfig.numberOfImagesPerSprite);
      this.isProgressBarOpen = true;
    }
    let self = this;
    let files = filesArray.splice(0,this.spriteConfig.numberOfImagesPerSprite - 1);

    Spritesmith.run({ src: files, algorithm: this.spriteConfig.layout, algorithmOpts: {sort: false},padding: this.spriteConfig.spacing }, function handleResult (err, result) {
      if (err) console.log("run error ",err);
      self.spriteData.next(result);

      self.progress = self.progress + 1;
      self.ipcService.send("progress",self.progress);
      if( filesArray.length ) self.getSpriteData(filesArray);
      else {
        self.spriteData.complete();
        self.isProgressBarOpen = false;
        self.progress = 0;
      }
    });
  }

  public compressImages(imageSrc) {
    let imageCompressor = new ImageCompressor;

    let compressorSettings = {
            toWidth : this.imageSize.width,
            toHeight : this.imageSize.height,
            mimeType : 'image/png',
            mode : 'strict',
            quality : 0.6,
            grayScale : true,
            sepia : true,
            threshold : 127,
            vReverse : true,
            hReverse : true,
            speed : 'low'
        };


    imageCompressor.run(imageSrc, compressorSettings, (compressedSrc) => {
      //console.log(path.parse(imageSrc).dir);
      fs.writeFileSync(path.join(path.parse(imageSrc).dir,"images","compressed.png"), this.dataURItoBlob(compressedSrc), 'binary', function(err){
            if (err) throw err
      });
    });
  }

  dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
    var blob = new Blob([ab], {type: mimeString});
    console.log(blob);
      return blob;
    }
  }


  setImageSize(imgSrc) {
    console.log(imgSrc);
       var imgLoader = new Image(); // create a new image object
       let self = this;
      imgLoader.onload = function() { // assign onload handler
          self.imageSize.height = imgLoader.height;
          self.imageSize.width = imgLoader.width;
          console.log('Image size: ',self.imageSize);
      }
      imgLoader.src = imgSrc;
      this.compressImages(imgSrc);


  }

}
