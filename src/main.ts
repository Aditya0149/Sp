import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { enableLiveReload , addBypassChecker} from 'electron-compile';
const ProgressBar = require('electron-progressbar');
const ipc = require('ipc');
const path = require("path");
addBypassChecker((filePath) => { return filePath.indexOf(app.getAppPath()) === -1 && (/.jpg/.test(filePath) || /.JPG/.test(filePath) || /.ms/.test(filePath) || /.gif/.test(filePath) || /.GIF/.test(filePath) || /.PNG/.test(filePath) || /.png/.test(filePath)); });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | null;
let progressBar;
const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload();

const createWindow = async () => {


  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 710,
    minWidth: 1200,
    minHeight: 730,
    titleBarStyle: 'hidden',
    show:false,
    "webPreferences":{
      "webSecurity":false
    }
  });
  // and load the index.html of the app.
  mainWindow.loadURL(path.join("file://",`${__dirname}`,"/index.html"));

  // Open the DevTools.
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
  mainWindow.webContents.on("crashed",() => {
    handleCrash("crashed");
  });

  mainWindow.on("unresponsive",() => {
    handleCrash("unresponsive");
  });
});




// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

let info = {
  type: 'info',
  title: 'Info',
  message: "",
  buttons: ['Ok']
}

ipcMain.on('open-information-dialog', (event,msg) => {
  info.message = msg;
  dialog.showMessageBox(info, (index) => {
    event.sender.send('information-dialog-selection', index)
  })
});

ipcMain.on('disable-menuitem', (event,menuitem) => {
  menu.getMenuItemById(menuitem).enabled = false;
});

ipcMain.on('enable-menuitem', (event,menuitem) => {
  menu.getMenuItemById(menuitem).enabled = true;
});

ipcMain.on('hide-menuitem', (event,menuitem) => {
  menu.getMenuItemById(menuitem).hide = true;
});

ipcMain.on('open-progress-bar', (event,maximumValue) => {
  let progressBar = new ProgressBar({
    indeterminate: false,
    text: 'Processing images...',
    detail: '0% completed',
    maxValue: maximumValue
  });
  progressBar
  .on('completed', () => {
    progressBar.detail = 'Images processed...';
  })
  .on('aborted', () => {
    progressBar.detail = 'Images processed...';
  })
  .on('progress', (value) => {
    progressBar.detail = Math.round( ( value / progressBar.getOptions().maxValue ) * 100 ) + "% completed";
  })

  ipcMain.on('progress', (event,progress) => {
    progressBar.value = progress;
  });

});


let handleCrash = (msg) => {
  let crashAndHangOptions = {
    type:"info",
    title:"Something went wrong",
    message:"The tool is "+msg,
    buttons:['Restart','close']
  }
  dialog.showMessageBox(crashAndHangOptions,(index) => {
    if (index == 0) mainWindow.reload();
    else mainWindow.close();
  });
};

let template = [
  {
    label:"Animation",
    submenu: [{
        label:"Add images",
        id:"add_images",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+O'
          } else {
            return 'Ctrl+O'
          }
        })(),
        click: (item,focusedWindow) => {
          dialog.showOpenDialog({
            title : "Select files",
            buttonLabel : "Select files",
            filters: [ {name: 'Images', extensions: ['jpg','jpeg','png','.gif']} ],
            FilterIndex : 1,
            properties: ['openFile', 'showHiddenFiles', 'multiSelections']
          }, (files) => {
            if (files) {
              mainWindow.webContents.send('selected-directory', files)
            }
          })
        }
      },
      {
        label:"Create new",
        id:"create_new",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+R'
          } else {
            return 'Ctrl+N'
          }
        })(),
        click: (item,focusedWindow) => {
          const options = {
            type: 'info',
            title: 'Create new animation',
            message: "Creating new animation will remove all present data. Do you want to continue ?",
            buttons: ['Yes', 'No']
          }
          dialog.showMessageBox(options, (index) => {
            if (index === 0) focusedWindow.reload();
          })
        }
      }]
  },

  {
    label: 'Configurations',
    submenu: [
      {
        label:"File list",
        id:"file_list",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+L'
          } else {
            return 'Ctrl+L'
          }
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            mainWindow.webContents.send('toggle-display','File list');
          }
        }
      },
      {
        label:"Export options",
        id:"export_options",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+E'
          } else {
            return 'Ctrl+E'
          }
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            mainWindow.webContents.send('toggle-display','Export options');
          }
        }
      }
    ]
  },

  {
    label:"Export",
    submenu: [
      {
        label:"Export Sprite sheets and JSON file",
        id:"export",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+I'
          } else {
            return 'Ctrl+I'
          }
        })(),
        click: (item,focusedWindow) => {
          dialog.showOpenDialog({
            title : "Select a destination folder",
            buttonLabel : "Select folder",
            properties: ['openDirectory','showHiddenFiles']
          }, (files) => {
            if (files) {
              mainWindow.webContents.send('export-sprites', files)
            }
          })
        }
      }
    ]
  },

  {
    label: 'Toggle Developer Tools',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Command+D'
      } else {
        return 'Ctrl+D'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }

]


const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
