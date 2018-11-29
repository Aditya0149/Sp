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
      <ng-content></ng-content>
      <form [formGroup]="configForm" (ngSubmit)="onSubmit()">

        <div class="form-group"><label class="form-label">Framerate</label><input class="form-control" type="text" formControlName="framerate"></div>
        <div class="form-group">
          <label class="form-label">Select a layout</label>
          <select class="form-control" formControlName="layout">
            <option [ngValue]="" disabled>Select a layout</option>
            <option *ngFor="let opt of spriteDataService.layoutArray" [ngValue]="opt">{{opt}}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Max Area</label><input class="form-control" type="text" formControlName="maxArea"></div>
        <div class="form-group"><label class="form-label">Spacing</label><input class="form-control" type="text" formControlName="spacing"></div>
        <div class="form-group"><label class="form-label">FileType</label><input class="form-control" type="text" formControlName="fileType"></div>
        <div class="form-group"><label class="form-label">Animation Prefix</label><input class="form-control" type="text" formControlName="animationPrefix"></div>
        <button type="submit" >Apply</button>
      </form>
  </div>`,
})
export class ConfigComponent{
  spriteConfig = this.spriteDataService.spriteConfig;
  configForm = new FormGroup({
    framerate : new FormControl(this.spriteConfig.framerate);
    layout : new FormControl(this.spriteConfig.layout);
    maxArea : new FormControl(this.spriteConfig.maxArea);
    spacing : new FormControl(this.spriteConfig.spacing);
    fileType : new FormControl(this.spriteConfig.fileType);
    animationPrefix : new FormControl(this.spriteConfig.animationPrefix);
  })
  constructor(public spriteDataService:SpriteDataService){}
  ngOnInit(){

  }
  onSubmit(){
    this.spriteDataService.spriteConfig = this.configForm.value;
    alert("Data applied");
  }

}
