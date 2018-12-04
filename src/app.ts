import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent, MovableDirective } from './app.component/app.component.ts';
import { PreviewComponent } from './preview.component/preview.component.ts';
import { ConfigComponent } from './sprite-config.component/sprite-config.component.ts';
import { IpcService } from './services/ipc.service.ts';
import { SpriteDataService } from './services/sprite-data.service.ts';

@NgModule({
  imports: [BrowserModule,FormsModule,ReactiveFormsModule],
  exports: [],
  declarations: [AppComponent,PreviewComponent,ConfigComponent, MovableDirective],
  bootstrap: [AppComponent],
  providers: [
    IpcService,SpriteDataService
  ]
})
export class AppModule {}
