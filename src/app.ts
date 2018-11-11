import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { PreviewComponent } from './preview.component';
import { IpcService } from './ipc.service.ts';
import { SpriteDataService } from './sprite-data.service.ts';
import { ConfigComponent } from './sprite-config.component.ts';

@NgModule({
  imports: [BrowserModule,FormsModule,ReactiveFormsModule],
  declarations: [AppComponent,PreviewComponent,ConfigComponent],
  bootstrap: [AppComponent],
  providers: [
    IpcService,SpriteDataService
  ]
})
export class AppModule {

}
