// angular modules
import { Component, OnInit, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';

// app modules
import { IpcService } from '../services/ipc.service.ts';
import { SpriteDataService } from '../services/sprite-data.service.ts';

@Component({
  selector: 'config',
  templateUrl:'./sprite-config.component/config.html',
  styleUrls:['./index.css']
})
export class ConfigComponent{
  private spriteConfig = this.spriteDataService.spriteConfig;
  public configForm = new FormGroup({
    framerate : new FormControl(this.spriteConfig.framerate);
    layout : new FormControl(this.spriteConfig.layout);
    maxArea : new FormControl(this.spriteConfig.maxArea);
    spacing : new FormControl(this.spriteConfig.spacing);
    fileType : new FormControl(this.spriteConfig.fileType);
    animationPrefix : new FormControl(this.spriteConfig.animationPrefix);
  })

  constructor(public spriteDataService:SpriteDataService){}

  public onSubmit(){
    this.spriteDataService.spriteConfig = this.configForm.value;
    alert("Data applied");
  }

}
