// angular modules
import { Component, Directive, OnInit, NgZone, ViewChild, ElementRef, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';

//app modules
import { IpcService } from '../services/ipc.service.ts';
import { SpriteDataService } from '../services/sprite-data.service.ts';
import { PreviewComponent } from '../preview.component/preview.component.ts';
import { ConfigComponent } from '../sprite-config.component/sprite-config.component.ts';

// node modules
const Spritesmith = require('spritesmith');
const fs = require("fs");
const jsonFile = require("jsonfile");
const path = require("path");
const {ipcRenderer} = require('electron');
const {shell} = require('electron');
const os = require('os');

@Component({
  selector: 'App',
  templateUrl: './app.component/app.html',
  styleUrls: ['index.css']
})
export class AppComponent implements OnInit {
  @ViewChild(PreviewComponent)
  private previewComponent;
  public fileArray = [];
  private allSpritesArray = [];
  private useResizedImages = false;
  private files = [];
  public currentDisplay = "File list";
  public selectedIndex = 0;
  private destinationPath = "";
  public showDownlaods = false;
  public showOverlay = false;
  public scaleFactor = 0.5;
  public changePreview = true;
  private loadedImagesCount = 0;
  private notLoadedImages = [];

  constructor(private ipcService: IpcService, private zone:NgZone, private spriteDataService:SpriteDataService, public sanitizer: DomSanitizer){}

  ngOnInit() {
    this.showOverlay = true;
    this.ipcService.on('selected-directory', (event, filesPath) => {
      this.getFilesByPath(filesPath);
    });
    this.ipcService.on('export-sprites', (event, destinationPath) => {
      this.writeImageData(destinationPath[0]);
    });
    this.ipcService.on('toggle-display', (event,data) => {
      this.zone.run( ()=> {
        this.spriteDataService.showThumbnails = true;
        this.currentDisplay = data;
      })
    });
    this.ipcService.send("disable-menuitem","export");
    this.ipcService.send("enable-menuitem","add_images");
    this.showOverlay = false;
  }

  ngAfterViewChecked() {
    if(document.getElementsByClassName("border-success")[0] && this.previewComponent.isRunnuing) document.getElementsByClassName("border-success")[0].scrollIntoView(false);
  }

  private getFilesByPath(files){ // called after adding images by menu
    this.addImagesOperationInit();
    let ignoredFiles = [];
    if(!files.length) {
      alert("Please add valid images only.");
      this.showOverlay = false;
      return;
    }
    files.forEach( ( file, index ) => {
      let fileData = path.parse(file);
      if (this.spriteDataService.spriteConfig.allowedFileType.indexOf(fileData.ext.toLocaleLowerCase()) > -1) { // ignore if file format is not supported
          let fullpath = path.join(fileData.dir,fileData.name+fileData.ext);
          this.zone.run( ()=> {
            this.fileArray.push({
              name:fileData.name+fileData.ext,
              path:fileData.dir,
              fullpath:fullpath
            });
        });
        this.isImageLoaded(fullpath);
      } else {
        ignoredFiles.push(fileData.name);
      }
    });
    this.handleUnsupportedFiles(ignoredFiles);
  }

  public getFilesByDrop(event) { // called after adding images by drag and drop
    event.preventDefault();
    let ignoredFiles = [];
    this.addImagesOperationInit();
    if(!event.dataTransfer.files.length) {
      alert("Please drag valid files only.");
      this.showOverlay = false;
      return;
    }
    for (let f of event.dataTransfer.files) {
      let fileData = path.parse(f.path);
      if (this.spriteDataService.spriteConfig.allowedFileType.indexOf(fileData.ext.toLocaleLowerCase()) > -1) {
        this.fileArray.push({
          name:f.name,
          path:f.path.replace(f.name,""),
          fullpath:f.path
        });
        this.isImageLoaded(f.path);
      } else {
        ignoredFiles.push(f.path);
      }
    }
    this.handleUnsupportedFiles(ignoredFiles);
  }

  private handleUnsupportedFiles(ignoredFiles){
    if(ignoredFiles.length) {
      if(ignoredFiles.length == 1 && path.parse(ignoredFiles[0]).ext == "" ) alert("Cannot add folder here. Please add files only.");
      else alert("Few files are not added due to unsupported file formats.");
      this.showOverlay = false;
    }
    this.ipcService.send("enable-menuitem","export");
  }

  private addImagesOperationInit() {
    this.currentDisplay = 'File list'; // switch the display to 'file list'
    this.isRunnuing = false; // pause the preview before adding images.
    this.showOverlay = true; // show the overlay until all images gets load
    this.spriteDataService.showThumbnails = true;
    this.notLoadedImages = [];
  }

  private isImageLoaded(url){
    let img = new Image();
    img.onload = () => {
      this.loadedImagesCount++;
      console.log("loaded",url);
      if(this.loadedImagesCount == this.fileArray.length) this.addImagesOperationEnd();
    };
    img.onerror = () => {
      this.loadedImagesCount++;
      console.log("not loaded",url);
      this.notLoadedImages.push(url);
      if(this.loadedImagesCount == this.fileArray.length) this.addImagesOperationEnd();
    };
    img.src = url;
  }

  private addImagesOperationEnd(){
    setTimeout(()=>{
      this.zone.run( () => this.showOverlay = false );
      if(this.notLoadedImages.length) {
        alert("Few images not loaded due to unsupported format or they are currupted. They will be removed.");
        this.zone.run( () => {
          this.fileArray = this.fileArray.filter((image) => if( this.notLoadedImages.indexOf(image.fullpath) == -1 ) return image );
          this.loadedImagesCount = this.fileArray.length;
        });
      }
    },0);
  }

  public allowDrop(ev) { // to support drag and drop
    ev.preventDefault();
  }

  private getHWJsonFormatedObject():Object{
    let outputJsonObject = {};
    outputJsonObject.frames = [];
    outputJsonObject.sprite_sheets = [];
    outputJsonObject.animations = [{}];
    outputJsonObject.animations[0].frames = [];
    let prefix = this.spriteDataService.spriteConfig.animationPrefix;
    let frameRate = this.spriteDataService.spriteConfig.framerate;
    this.allSpritesArray.forEach( ( spriteData, index ) => {
      let coordinates = spriteData.coordinates;
      let properties = spriteData.properties;
      let framesArray = [];
      Object.keys(coordinates).forEach( key => {
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
      });
      outputJsonObject.sprite_sheets.push(properties);
    });

    outputJsonObject.name = prefix;
    outputJsonObject.info = {
      "calc_type": this.spriteDataService.spriteConfig.layout,
      "min_height": 0,
      "max_area": this.spriteDataService.spriteConfig.maxArea,
      "max_height": -1,
      "sort": "name",
      "max_width": -1,
      "min_width": 0,
      "spacing": this.spriteDataService.spriteConfig.spacing
    };
    outputJsonObject.animations[0].fps = frameRate;
    outputJsonObject.animations[0].name = prefix;
    return outputJsonObject;
  }

  private writeImageData(destinationPath){ // called after clicked on export menu item
    this.ipcService.send("disable-menuitem","export");
    this.ipcService.send("disable-menuitem","add_images");
    this.zone.run( ()=> { this.showOverlay = true; });
    let sourcePath = "";
    this.fileArray.forEach( file => {
      if (this.useResizedImages) sourcePath = path.join(file.path,'scaled/',path.parse(file.fullpath).name + ".png");
      else sourcePath  = path.join(file.path,file.name);
      this.files.push(sourcePath);
    } );

    let imgLoader = new Image();
    let areaPerImage = 0;
    imgLoader.onload = () => {
        areaPerImage = imgLoader.height * imgLoader.width;
        this.spriteDataService.getSpriteData(this.files,areaPerImage);
    }
    imgLoader.src = this.files[0];
    this.spriteDataService.spriteDataObservable.subscribe(data => {
      this.allSpritesArray.push(data);
    },
    err => {
      this.zone.run( () => this.showOverlay = false );
      this.ipcService.send("enable-menuitem","export");
    },
    complete => {
        let filepathWithPrefix = path.join(destinationPath,this.spriteDataService.spriteConfig.animationPrefix);
        this.allSpritesArray.forEach( ( spriteData, index ) => {
          fs.writeFileSync(filepathWithPrefix + "_" + index + ".png", spriteData.image, 'binary', (err) => {
                if (err) throw err
            });
        });
        jsonFile.writeFileSync(path.join(destinationPath,this.spriteDataService.spriteConfig.animationPrefix)+".json",this.getHWJsonFormatedObject());
        alert("Sprite images and json file exported");
        this.zone.run( ()=> {
          this.destinationPath = destinationPath;
          this.showDownlaods = true;
          this.showOverlay = false;
        });
        this.allSpritesArray = [];
        this.ipcService.send("enable-menuitem","create_new");
        this.ipcService.send("enable-menuitem","export");
        this.ipcService.send("enable-menuitem","add_images");
      }
    );
  }

  public openDestinationFolder(){ // caleld after ckicking on show downloads
    shell.openItem(this.destinationPath);
    this.showDownlaods = false;
  }

  private resizeImages() {

    if(!this.fileArray.length) {
      alert("Please add files first.");
      return 0;
    }
    if(this.scaleFactor <= 0) {
      alert("Please enter scale factor greater than 0");
      return 0;
    }
    if(this.scaleFactor > 1) {
      alert("Please enter scale factor less than 1");
      return 0;
    }

    this.useResizedImages = !this.useResizedImages;
    this.showOverlay = true;
    let dirname = "";
    this.fileArray.forEach((image,index)=>{
      let fileData = path.parse(image.fullpath);
      let fileType = fileData.ext.replace(".","");
      let fileName = fileData.name;
      let img = new Image();
      let oc = document.createElement('canvas'),
          octx = oc.getContext('2d');
      img.onload = () => {
        oc.width = img.width * this.scaleFactor;
        oc.height = img.height * this.scaleFactor;
        octx.drawImage(img, 0, 0, oc.width, oc.height);
        let base64Data = oc.toDataURL('image/png').replace(/^data:image\/png;base64,/, "");
        dirname = path.join(image.path,'scaled/');
        if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);
        fs.writeFileSync( dirname + fileName +".png", base64Data , 'base64', (err) => {
            if (err) throw err
        });
        if(this.fileArray.length - 1 == index) {
          this.zone.run( ()=> {
            this.showOverlay = false;
          });
        }
      }
      img.src = path.join(image.path,image.name);
    });
  }
  public deleteImage(index){
    this.fileArray.splice(index,1);
  }
}
