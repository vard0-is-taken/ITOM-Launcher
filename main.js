const electron = require('electron')
const url = require('url')
const path = require('path')
const { Client, Authenticator } = require('minecraft-launcher-core')
const launcher = new Client()
const { app, BrowserWindow, ipcMain } = electron
const os = require('os')
const fs = require('fs')
const open = require('open')
const request = require('request')
const ITOM = require('./itomApiUtil.js')

let mainWindow
let loginWindow
let api

//app.setAsDefaultProtocolClient('itom');
var selectedGame = 'vortex'
var gamesFolder = './games/'
var authPath = path.join(app.getPath('appData'), 'itom\\Auth.json')
var token = null
var isTokenLoaded = false

try {
    var authJsonData = fs.readFileSync(authPath, 'utf8')
    token = JSON.parse(authJsonData).token
    isTokenLoaded = true
} catch {}

try {
    token = process.argv
        .find((arg) => arg.startsWith('itom://'))
        .replace('itom://', '')
        .replace('/', '')
    isTokenLoaded = true
} catch {}

api = new ITOM(token, authPath, 'https://itom.fun/api/v1', gamesFolder, rendererProgressBarUpdate, isTokenLoaded)

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (e, argv) => {
        if (process.platform !== 'darwin') {
            try {
                token = argv
                    .find((arg) => arg.startsWith('itom://'))
                    .replace('itom://', '')
                    .replace('/', '')
            } catch {}
            if (token != 'null') {
                writeToken(token)
            }
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
            mainWindow.reload()
        }
    })
}

ipcMain.handle('getDeviceRam', async (event, ...args) => {
    const result = os.totalmem()
    return result
})
ipcMain.handle('getRoaming', async (event, ...args) => {
    const result = app.getPath('appData')
    return result
})
ipcMain.handle('getToken', async (event, ...args) => {
    return api.getToken()
})

//INITIALIZATION ENDED

app.on('ready', function () {
    ipcMain.on('CloseClick', () => CloseApp())
    ipcMain.on('MinClick', () => MinApp())
    ipcMain.on('OpenResources', () => OpenResources())
    ipcMain.on('LogOut', () => LogOut())
    ipcMain.on('Reload', () => Reload())
    ipcMain.on('OpenBrowser', (event, arg) => open(arg))
    ipcMain.on('LaunchClick', (event, arg) => LaunchMinecraft(arg))

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
        },
    })

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/mainWindow.html'),
            protocol: 'file:',
            slashes: true,
        })
    )

    mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.show()
    })

    mainWindow.removeMenu()
    mainWindow.webContents.openDevTools();
})

async function LaunchMinecraft(args) {
    if (!fs.existsSync(minecraftPath)) {
        console.log('download task was executed')
        fs.mkdirSync(minecraftPath)
        api.downloadGame('vortex')
    }
}

function Reload() {
    mainWindow.reload()
}

function LogOut() {
    if (token != 'null') {
        fs.unlinkSync(authPath)
        token = 'null'
        mainWindow.reload()
    }
}

function CloseApp() {
    mainWindow.close()
    try {
        loginWindow.close()
    } catch {}
}

function MinApp() {
    mainWindow.minimize()
}

function OpenResources() {
    require('child_process').exec('start "" "minecraft\\resourcepacks"')
}

function rendererProgressBarUpdate(percents) {
    console.log('downloading minecraft | ' + percents)
    mainWindow.webContents.send('percentUpdate', percents)
}