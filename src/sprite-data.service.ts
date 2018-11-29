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
    maxArea : 3000000;
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
  completeCalled = false;
  areaPerImage = 0;
  numberOfImagesPerSprite = 10;

  constructor(private ipcService:IpcService){};

  public getSpriteData(filesArray:Object,areaPerImage):Observable<Object> {
    if(!this.isProgressBarOpen) {
      this.numberOfImagesPerSprite = Math.floor(this.spriteConfig.maxArea/areaPerImage);
      this.ipcService.send("open-progress-bar",filesArray.length/this.numberOfImagesPerSprite);
      this.isProgressBarOpen = true;
    }
    let self = this;

    let files = filesArray.splice(0,this.numberOfImagesPerSprite);

    Spritesmith.run({ src: files, algorithm: this.spriteConfig.layout, algorithmOpts: {sort: false},padding: this.spriteConfig.spacing }, function handleResult (err, result) {
      if (err) console.log("run error ",err);
      self.spriteData.next(result);

      self.progress = self.progress + 1;
      self.ipcService.send("progress",self.progress);
      if( filesArray.length ) self.getSpriteData(filesArray,areaPerImage);
      else {
          self.spriteData.complete();
          self.isProgressBarOpen = false;
          self.progress = 0;
          self.spriteData = new Subject<Object>();
          self.spriteDataObservable = self.spriteData.asObservable();
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
      let areaPerImage = 0;
      imgLoader.onload = function() { // assign onload handler
          areaPerImage = imgLoader.height * imgLoader.width;
          console.log('Image size: ',areaPerImage);
          self.areaPerImage = areaPerImage;
      }
      imgLoader.src = imgSrc;
  }


}
