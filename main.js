const electron = require('electron');
const url = require('url');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();
const { app, BrowserWindow, ipcMain } = electron;
const os = require('os');
const fs = require('fs');
const open = require('open');
const request = require('request')

let mainWindow;
let loginWindow;

//app.setAsDefaultProtocolClient('vortex-launcher');
var minecraftPath = './minecraft'
var MCCurrentVersionUrl = 'https://vortex-mc.site/downloads/vortex.zip'
var authPath = path.join(app.getPath("appData"), "vortex-launcher\\Auth.json");
var token = '00140bdcd0289272aeed6a5b03611d1125a83cf4b0b0d4bc1c95baa4a1708c74'
try {
var authJsonData = fs.readFileSync(authPath, "utf8")
token = JSON.parse(authJsonData).token
}
catch{}

try{token = process.argv.find((arg) => arg.startsWith('vortex-launcher://')).replace('vortex-launcher://', '').replace('/', '');}
catch{}
if (token != 'null'){
    writeToken(token)
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}
else {
  app.on('second-instance', (e, argv) => {
    if (process.platform !== 'darwin') {
        try{token = argv.find((arg) => arg.startsWith('vortex-launcher://')).replace('vortex-launcher://', '').replace('/', '');}
        catch{}
        if (token != 'null'){
            writeToken(token)
        }
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.reload();
    }
  });
}

function writeToken(token) {
    var tokenJson = {
        token: token
    }
    fs.writeFile(authPath, JSON.stringify(tokenJson), function(err, result) {
        if(err) console.log('error', err);
    });
}

ipcMain.handle('getDeviceRam', async (event, ...args) => {
            const result = os.totalmem();
            return result
        })
ipcMain.handle('getRoaming', async (event, ...args) => {
            const result = app.getPath("appData");
            return result
        })
ipcMain.handle('getToken', async (event, ...args) => {
    return token
})

app.on('ready', function () {
    ipcMain.on('CloseClick', () => CloseApp());
    ipcMain.on('MinClick', () => MinApp());
    ipcMain.on('OpenResources', () => OpenResources());
    ipcMain.on('LogOut', () => LogOut());
    ipcMain.on('Reload', () => Reload());
    ipcMain.on('OpenBrowser', (event, arg) => open(arg));
    ipcMain.on('LaunchClick', (event, arg) => LaunchMinecraft(arg));

    mainWindow = new BrowserWindow({
        width: 970,
        minWidth: 970,
        height: 575,
        minHeight: 575,
        show: false,
        frame: false,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            nodeIntegrationInSubFrames: true,
            webviewTag: true,
            nodeIntegration: true,
            experimentalFeatures: true,
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'src/mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.show();
    });

    mainWindow.removeMenu();
    //mainWindow.webContents.openDevTools();
});

async function LaunchMinecraft(args) {
    if (!fs.existsSync(minecraftPath)) {
        console.log('download task was executed, starting download from '+MCCurrentVersionUrl+', to '+minecraftPath+'/minecraft.zip')
        fs.mkdirSync(minecraftPath)
        download(MCCurrentVersionUrl, minecraftPath+'/minecraft.zip', pfu, pfe, pff)
    }
}

function Reload() {
    mainWindow.reload();
}

function LogOut() {
    if (token != 'null') {
        fs.unlinkSync(authPath)
        token = 'null'
        mainWindow.reload();
    }
}

function CloseApp() {
    mainWindow.close();
    try {
        loginWindow.close();
    }
    catch { }
}

function MinApp() {
    mainWindow.minimize();
}

function OpenResources() {
    require('child_process').exec('start "" "minecraft\\resourcepacks"');
}

function download(url, path, percentFuncUpdate, percentFuncError, percentFuncFin) {

    const file = fs.createWriteStream(path)
    var receivedBytes = 0
    var totalBytes = 0
    var lastSended = -1
    
    request.get(url)
    .on('response', (response) => {
        if (response.statusCode == 200) {
            totalBytes = response.headers['content-length']
        }
        else{
            return
        }
    })
    .on('data', (chunk) => {
        receivedBytes += chunk.length
        var perc = (receivedBytes/totalBytes*100).toFixed(1)
        if (perc!=lastSended){
            percentFuncUpdate(perc)
            lastSended = perc
        }
    })
    .pipe(file)
    .on('error', (err) => {
        fs.unlink(path)
        percentFuncError()
    });

    file.on('finish', () => {
        file.close()
        percentFuncFin()
    });

    file.on('error', (err) => {
        fs.unlink(path)
        percentFuncError()
    });
}

async function pfu(percents) {
    console.log('downloading minecraft | '+percents)
    mainWindow.webContents.send('percentUpdate', percents)
}

async function pfe() {
    console.log('pizdec')
    //fade percentage to 0
    //display error message
}

async function pff() {
    console.log('downloaded minecraft succesfully')
    //checksum
    //fade percentage to 0
    //reload mainWindow
}
