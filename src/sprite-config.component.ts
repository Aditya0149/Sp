import { Component, OnInit, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IpcService } from './ipc.service.ts';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { SpriteDataService } from './sprite-data.service.ts';

@Component({
  selector: 'Config',
  template:
  `<div>
    <label>
      Frame rate:
      <form [formGroup]="configForm" (ngSubmit)="spriteDataService.spriteConfig = configForm.value">
        <label>framerate</label><input type="text" formControlName="framerate"><br/>
        <select formControlName="layout">
          <option [ngValue]="" disabled>Select a layout</option>
          <option *ngFor="let opt of spriteDataService.layoutArray" [ngValue]="opt">{{opt}}</option>
        </select>
        <br/>
        <label>numberOfImagesPerSprite</label><input type="text" formControlName="numberOfImagesPerSprite"><br/>
        <label>spacing</label><input type="text" formControlName="spacing"><br/>
        <label>fileType</label><input type="text" formControlName="fileType"><br/>
        <label>animationPrefix</label><input type="text" formControlName="animationPrefix"><br/>
        <button type="submit" >Apply</button>
      </form>
    </label>
  </div>`,
})
export class ConfigComponent{
  spriteConfig = this.spriteDataService.spriteConfig;
  configForm = new FormGroup({
    framerate : new FormControl(this.spriteConfig.framerate);
    layout : new FormControl(this.spriteConfig.layout);
    numberOfImagesPerSprite : new FormControl(this.spriteConfig.numberOfImagesPerSprite);
    spacing : new FormControl(this.spriteConfig.spacing);
    fileType : new FormControl(this.spriteConfig.fileType);
    animationPrefix : new FormControl(this.spriteConfig.animationPrefix);
  })
  constructor(public spriteDataService:SpriteDataService){}
  ngOnInit(){

  }
}
