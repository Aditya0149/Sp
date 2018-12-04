// angular modules
import { Component, OnInit, NgZone, Input, Output, EventEmitter, IterableDiffers } from '@angular/core';
import { CommonModule } from '@angular/common';

//app modules
import { IpcService } from '../services/ipc.service.ts';
import { SpriteDataService } from '../services//sprite-data.service.ts';

//node modules
const Pixelsmith = require('pixelsmith');
const Spritesmith = require('spritesmith');
const path = require("path");

@Component({
  selector: 'preview',
  template:
  `<div>
    <div id="previewWrapper" data-toggle="tooltip" title="{{this.isRunnuing ? 'pause' : 'play'}}" >
      <img (click)="generatePreview($event)" id="preview_img" src="../images/play_btn.png" />
    </div>
  </div>`,
  styleUrls: ['./index.css']
})
export class PreviewComponent implements OnInit {
  @Input() private previewFileArray;
  @Input() private previewIndex;
  @Input() private changePreview;
  @Output() private previewIndexchange = new EventEmitter<number>();
  private frameRate = 24;
  private isRunnuing = false;
  private previewInterval = null;

  constructor(private spriteDataService:SpriteDataService, private ipcService:IpcService, private _differs: IterableDiffers){};

  ngOnInit() {
    this.spriteDataService.message.subscribe((msg)=>{
        if(msg == "update preview"){
          clearInterval(this.previewInterval);
          this.previewInterval = null;
          this.previewIndex = 0;
          this.previewIndexchange.emit(this.previewIndex);
          this.frameRate = this.spriteDataService.spriteConfig.framerate;
          this.isRunnuing = false;
        }
    });
  }

  ngOnChanges(changes:SimpleChanges){
    if(!this.isRunnuing && this.img !== undefined) {
     Object.keys(changes).forEach( (key) => {
      if(key == "previewIndex") {
         let file = this.previewFileArray[this.previewIndex];
         this.img.src = path.join(file.path,file.name);
       }
     });
   }
  }

  public generatePreview(){
    if (!this.previewFileArray.length) {
      this.ipcService.send('open-information-dialog',"Please add files first");
      return;
    }

    this.img = document.getElementById("preview_img");
    if(!this.previewInterval) {
      this.previewInterval = setInterval(()=>{
          if(this.previewFileArray[this.previewIndex]) {
            this.img.src = this.previewFileArray[this.previewIndex].fullpath;
            this.previewIndex++;
          } else {
            this.previewIndex = 0;
            this.previewIndexchange.emit(this.previewIndex);
          }

      },1000/this.frameRate);
    }

    if(this.isRunnuing) { // preview running and clicked
      clearInterval(this.previewInterval);
      this.previewInterval = null;
    }
    this.isRunnuing = !this.isRunnuing;
  }

}
