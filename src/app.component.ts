import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { IpcService } from './ipc.service.ts';
import { SpriteDataService } from './sprite-data.service.ts';
import { PreviewComponent } from './preview.component.ts';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
var Spritesmith = require('spritesmith');
var fs = require("fs");
var jsonFile = require("jsonfile");
var path = require("path");
var {ipcRenderer} = require('electron');


@Component({
  selector: 'App',
  template:
  `<div class="app_wrapper row">
    <div class="col">
      <div (drop)="getFiles($event)" (dragover)="allowDrop($event)" class="file_list" *ngIf="displayFiles">
        <div *ngIf="!fileArray.length">Upload Files Here</div>
        <div *ngFor="let file of fileArray; let i = index" [ngClass]="['image_' + i,'file_list_item','card']" [class.border-success]="previewComponent.previewIndex == i" (click)="selectedIndex=i">
          <img class="card-img-top" [src]="sanitizer.bypassSecurityTrustUrl(file.fullpath)" [alt]="file.name"/>
          <div class="card-body"><h5 class="card-title"></h5>{{file.name}}</div>
        </div>
      </div>
      <Config *ngIf="!displayFiles" ></Config>
    </div>
    <Preview class="col preview" [previewFileArray]=fileArray [(previewIndex)]=selectedIndex ></Preview>
    <div id='output'></div>
  </div>`,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(PreviewComponent)
  private previewComponent:PreviewComponent;
  public readonly name = 'electron-forge';
  public fileArray = [];
  spriteArray = []; // ?
  allSpritesArray = [];
  files = [];
  displayFiles = true;
  fileArrayObservable = new Subject<[]>();
  filesFetched = this.fileArrayObservable.asObservable();
  selectedIndex = 0;
  constructor(private ipcService: IpcService, private zone:NgZone, private spriteDataService:SpriteDataService, public sanitizer: DomSanitizer){}
  ngOnInit(): void {
    this.ipcService.on('selected-directory', (event, filesPath) => {
      fs.readdir(filesPath[0], (err, files) => {
        files.forEach(file => {
          let fileData = path.parse(file);
          if (fileData.ext == "." + this.spriteDataService.spriteConfig.fileType) { // ignore if its directory
              this.zone.run( ()=> {
                this.fileArray.push({
                  name:fileData.name+fileData.ext,
                  path:filesPath[0],
                  fullpath:path.join(filesPath[0],fileData.name+fileData.ext)
                });
            });
          }
        });

      });
      this.ipcService.send('open-information-dialog',"Files added");
    });

    this.ipcService.on('export-sprites', (event, destinationPath) => {
      this.writeImageData(destinationPath[0]);
    });


    this.ipcService.on('toggle-display', (event,data) => {
      this.zone.run( ()=> {
        if (data == "Export options") this.displayFiles = false;
        else this.displayFiles = true;
      })
    });


  }

  ngAfterViewChecked() {
    if(document.getElementsByClassName("border-success")[0] && this.previewComponent.isRunnuing) document.getElementsByClassName("border-success")[0].scrollIntoView(false);
  }

  getFiles(event):void{
    event.preventDefault();
    for (let f of event.dataTransfer.files) {
        this.fileArray.push({name:f.name,path:f.path.replace(f.name,"")});
    }
    this.ipcService.send('open-information-dialog',event);
  }


  allowDrop(ev) {
    ev.preventDefault();
  }

  encode (input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

  resizeBase64Img(data) {
    var img = new Image();

    img.onload = function () {

      // step 1 - resize to 50%
      var oc = document.createElement('canvas'),
          octx = oc.getContext('2d');

      oc.width = img.width * 0.5;
      oc.height = img.height * 0.5;
      octx.drawImage(img, 0, 0, oc.width, oc.height);

      // step 2
      octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

      // step 3, resize to final size
      ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
      0, 0, canvas.width, canvas.height);
    }
    img.src = "data:image/png;base64," + this.encode(data);
    return img;
  }

  writeImageData(destinationPath){
    this.fileArray.forEach( file => {
      this.files.push(path.join(file.path,file.name));
    } );
    this.spriteDataService.getSpriteData(this.files);
    this.spriteDataService.spriteDataObservable.subscribe(data => {
      this.allSpritesArray.push(data);
    },
    err => { console.log(err); },
    complete => {
        let filepathWithPrefix = path.join(destinationPath,this.spriteDataService.spriteConfig.animationPrefix);
        this.allSpritesArray.forEach( ( spriteData, index ) => {
          //this.encode(spriteData.image);
          //let img = document.createElement("img");
          //img.src = "data:image/png;base64," + this.encode(spriteData.image);
          document.getElementById("output").appendChild(this.resizeBase64Img(spriteData.image));
          fs.writeFileSync(filepathWithPrefix + "_" + index + ".png", spriteData.image, 'binary', function(err){
                if (err) throw err
            });
        });
        jsonFile.writeFileSync(path.join(destinationPath,this.spriteDataService.spriteConfig.animationPrefix)+".json",this.getHWJsonFormat());
        alert("Sprite images and json file exported");
      }
    );
  }

  getHWJsonFormat():Object{
    let outputJsonObject = {};
    outputJsonObject.frames = [];
    outputJsonObject.sprite_sheets = [];
    outputJsonObject.animations = [{}];
    outputJsonObject.animations[0].frames = [];
    let prefix = this.spriteDataService.spriteConfig.animationPrefix;
    let frameRate = this.spriteDataService.spriteConfig.framerate;
    //let inputObj = result.coordinates;

    this.allSpritesArray.forEach( ( spriteData, index ) => {
      let coordinates = spriteData.coordinates;
      let properties = spriteData.properties;
      let framesArray = [];
      Object.keys(coordinates).forEach( key => {
        //debugger;
        let ip = coordinates[key];
        let keyName = ''+key;
        ip.name = key;
        ip.sprite_x = ip.x;
        delete(ip.x);
        ip.sprite_y = ip.y;
        delete(ip.y);
        ip.sprite_index = index;
        ip.colorRect = {
          "width": Math.round( ip.width ),
          "y": 0,
          "height": Math.round( ip.height ),
          "x": 0
        }
        outputJsonObject.frames.push(ip);
        outputJsonObject.animations[0].frames.push({frame : keyName});
        //debugger;
      });
      outputJsonObject.sprite_sheets.push(properties);
      //debugger;
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
    return outputJsonObject;
  }


}
