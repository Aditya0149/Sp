import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { enableLiveReload } from 'electron-compile';
const ProgressBar = require('electron-progressbar');
var ipc = require('ipc');


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
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    show:false
  });
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu)
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

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

const fileAddedInfo = {
  type: 'info',
  title: 'Files added',
  message: "Files are added",
  buttons: ['Ok']
}

ipcMain.on('open-information-dialog', (event) => {

  dialog.showMessageBox(fileAddedInfo, (index) => {
    event.sender.send('information-dialog-selection', index)
  })
});

ipcMain.on('open-progress-bar', (event,maximumValue) => {
  let progressBar = new ProgressBar({
    indeterminate: false,
    text: 'Processing images...',
    detail: '0% completed',
    maxValue: maximumValue
  });
  progressBar
  .on('completed', function() {
    progressBar.detail = 'Images processed...';
  })
  .on('aborted', function() {
    progressBar.detail = 'Images processed...';
  })
  .on('progress', (value) => {
    progressBar.detail = Math.round( ( value / progressBar.getOptions().maxValue ) * 100 ) + "% completed";
  })

  ipcMain.on('progress', (event,progress) => {
    progressBar.value = progress;
  });

});






function handleCrash(msg){
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
        label:"Create new",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+R'
          } else {
            return 'Ctrl+N'
          }
        })(),
        click: (item,focusedWindow) => {
          focusedWindow.reload()
        }
      },
      {
      label:"Add images",
      accelerator: (() => {
        if (process.platform === 'darwin') {
          return 'Command+O'
        } else {
          return 'Ctrl+O'
        }
      })(),
      click: (item,focusedWindow) => {
        dialog.showOpenDialog({
          title : "Select a source folder",
          buttonLabel : "Select folder",
          filters: [ {name: 'Images', extensions: ['jpg', 'png', 'gif']} ]
          properties: ['openFile', 'openDirectory','multiSelections']
        }, (files) => {
          if (files) {
            mainWindow.webContents.send('selected-directory', files)
          }
        })
      }
    }]
  },
  {
    label: 'Configurations',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Command+G'
      } else {
        return 'Ctrl+G'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
      }
    }
  },

  {
    label:"Export",
    submenu: [
      {
        label:"Export Sprite Images",
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
              mainWindow.webContents.send('sprite-destination-directory', files)
            }
          })
        }
      },
      {
        label:"Export Json file",
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Command+J'
          } else {
            return 'Ctrl+J'
          }
        })(),
        click: (item,focusedWindow) => {
          dialog.showOpenDialog({
            title : "Select a destination folder",
            buttonLabel : "Select folder",
            properties: ['openDirectory','showHiddenFiles']
          }, (files) => {
            if (files) {
              mainWindow.webContents.send('json-destination-directory', files)
            }
          })
        }
      }
    ]

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
