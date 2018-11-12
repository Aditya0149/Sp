import { Component, OnInit, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpriteDataService } from './sprite-data.service.ts';
var Pixelsmith = require('pixelsmith');
var Spritesmith = require('spritesmith');
var path = require("path");
var Pixelsmith = require('pixelsmith');

@Component({
  selector: 'Preview',
  template:
  `<div style="width:100%;min-height:800px;" (click)="generatePreivew($event)">
    <div id="previewWrapper" >

      <!-- input [(ngModel)]="frameRate" / -->
    </div>
    <!-- button (click)="!pause">pause</button -->
  </div>`
})
export class PreviewComponent implements OnInit {
  @Input() previewFileArray;
  files = [];
  frameRate = 24;
  pause = false;
  constructor(private spriteDataService:SpriteDataService){};
  ngOnInit(){

  }
  generatePreivew():void{
    this.previewFileArray.forEach( file => {
      this.files.push(path.join(file.path,file.name));
    } );

    this.img = document.createElement("img");
    document.getElementById("previewWrapper").append(this.img);
    let self = this;
    let i = 0;
    let interval = setInterval(()=>{
        if(this.files[i]) {
          self.img.src = this.files[i];
          i++;
        } else {
          i = 0;
        }
    },1000/this.frameRate);
  }




/* this code is not currently in use */
/*  getSpriteImageData(){
    let self = this;
    let image = "";
    this.message = "Processing the images...";
    this.spriteDataService.getSpriteData(this.files);
    this.spriteDataService.spriteDataObservable.subscribe(data => {
      console.log(data);
      this.allSpritesArray.push(data);
    },

    err => { console.log(err); },
    complete => {
        console.log("complete",this.allSpritesArray);
        //this.previewMode = true;
        //this.createCanvas();
        //this.createImages();
        //this.renderPreview();
      }
    );
  }


  createImages(){
    for(let i = 0; i < this.allSpritesArray.length; i++){
      let spriteImage = new Image();
      let blob = new Blob([this.allSpritesArray[i].image], {'type': 'image/png'});
      spriteImage.src=URL.createObjectURL(blob);
      this.spriteImages.push(spriteImage);
    }
  }
  renderPreview():void{
    let self = this;
    this.spriteImages[this.spritesIndex].onload = function(){
      self.ctx.drawImage(this,0,0);
    }
    this.startAnimation(Object.values(this.allSpritesArray[this.spritesIndex].coordinates),this.spriteImages[this.spritesIndex]);
    //this.interval = setInterval(()=>this.updatePreview(this.allSpritesArray[this.spritesIndex].coordinates),this.spriteImages[this.spritesIndex]),1000/this.frameRate++);
  }

  startAnimation(coordinates,spriteImage){
    this.interval = setInterval(()=>this.updatePreview(coordinates[this.frameIndex++],spriteImage),1000/this.frameRate);
  }

  createCanvas():void{
    this.canvas = document.createElement("canvas");

    let sampleImage = Object.values(this.allSpritesArray[0].coordinates)[0]);
    this.canvas.width = sampleImage.width;
    this.canvas.height = sampleImage.height;

    this.ctx = this.canvas.getContext("2d");
    document.getElementById("canvasWrapper").append(this.canvas);
    document.getElementById("canvasWrapper").style.transform = "scale("+ ( 400/sampleImage.width ) +")"
    document.getElementById("canvasWrapper").style.transformOrigin = "0 0 0";

  }

  updatePreview(image,spriteImage):void{
    if(image != undefined) {
      this.ctx.clearRect(0, 0, image.width, image.height);
      this.ctx.drawImage(spriteImage,image.x,image.y,image.width,image.height,0,0,image.width,image.height);
    } else {
      clearInterval(this.interval);
      this.spritesIndex = this.spritesIndex + 1;
      this.frameIndex = 0;
      if (this.allSpritesArray[this.spritesIndex]) this.renderPreview();
    }
  }
  files = [];
  message = "Click to generate preview";
  spriteData:Object = {};
  previewMode = false;
  canvas = "";
  ctx = "";
  image = "";
  frameIndex = 0;
  frameCount = 0;
  frameRate = 24;
  sampleImage = "";
  pause = false;
  allSpritesArray = [];
  spriteImages = [];
  spritesIndex = 0;

  */
}
