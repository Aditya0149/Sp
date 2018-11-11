import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  `<div style="display:flex">
    <div style="height:auto;width:500px;overflow:scroll;" (drop)="getFiles($event)" (dragover)="allowDrop($event)">
      <div *ngIf="!fileArray.length">Upload Files Here</div>
      <div *ngFor="let file of fileArray">{{ file.name }}</div>
    </div>
    <preview [previewFileArray]=fileArray></preview>
    <Config *ngIf="fileArray.length" ></Config>
  </div>`,
})
export class AppComponent implements OnInit {
  @ViewChild(PreviewComponent)
  private previewComponent:PreviewComponent;
  public readonly name = 'electron-forge';
  public fileArray = [];
  spriteArray = [];
  message = "";
  fileArrayObservable = new Subject<[]>();
  filesFetched = this.fileArrayObservable.asObservable();

  constructor(private ipcService: IpcService, private zone:NgZone, private spriteDataService:SpriteDataService){}
  ngOnInit(): void {
    this.ipcService.on('selected-directory', (event, filesPath) => {
      fs.readdir(filesPath[0], (err, files) => {
        files.forEach(file => {
          let fileData = path.parse(file);
          if (fileData.ext) { // ignore if its directory
              this.zone.run( ()=> {
                this.fileArray.push({name:fileData.name+fileData.ext,path:filesPath[0]});
            });
          }
        });

      });
      this.ipcService.send('open-information-dialog',event);
    });

    this.ipcService.on('sprite-destination-directory', (event, destinationPath) => {
        let filepathWithPrefix = path.join(destinationPath[0],this.spriteDataService.spriteConfig.animationPrefix);
        this.previewComponent.allSpritesArray.forEach( ( spriteData, index ) => {
          fs.writeFileSync(filepathWithPrefix + "_" + index + ".png", spriteData.image, 'binary', function(err){
                    if (err) throw err
            });
        });
      alert("Sprite images created");
    });

    this.ipcService.on('json-destination-directory', (event, destinationPath) => {
      
    });



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
}
