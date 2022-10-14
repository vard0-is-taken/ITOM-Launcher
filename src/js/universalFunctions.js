const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

const availableGames = ['vortex', 'ageplanet']

const defaultSettings = {
    'vortex': {
        'ram':'512'
    },
    'ageplanet': {
        'ram':'512'
    },
    'lastGame': 'vortex'
}

let settings = defaultSettings
let selectedGame = 'vortex'
var token = 'null'

ipcRenderer.on('percentUpdate', function (evt, message) {
    document.getElementById('percentage').style.width = message + '%'
})

init()

async function init() {
    await GetToken()
    await loadSettings()
}

async function loadSettings() {
    settings = await GetSettings()
    selectedGame = settings != null ? settings.lastGame : defaultSettings.lastGame
}

async function saveData() {
    var settingsPATH = await GetSettingsPATH()
    var settingsJSON = settings != null ? settings : {}

    for (var game of availableGames) {
        settingsJSON[game] = {'ram': settings[game].ram}
    }
    settingsJSON.lastGame = settings.lastGame

    var jsonString = JSON.stringify(settingsJSON, null, 2)
    fs.writeFileSync(settingsPATH, jsonString)
}

var settingsState = false
var serversState = false

async function Settings() {
    var button = document.getElementById('sett')
    if (!settingsState) {
        document.getElementById('servers').style.display = 'none'
        document.getElementById('serr').classList.remove('sett-active')
        serversState = false
        button.classList.add('sett-active')
        settingsState = true
        var slider = document.getElementById('ramRange')
        var output = document.getElementById('ramValue')
        var allram = await ipcRenderer.invoke('getDeviceRam')
        slider.value = settings[selectedGame].ram
        output.textContent = settings[selectedGame].ram + 'mb'
        slider.max = allram / 1048576
        slider.oninput = function () {
            settings[selectedGame].ram = this.value
            output.textContent = this.value + 'mb'
        }
        document.getElementById('backdrop').classList.add('darkenBG')
        document.getElementById('settings').style.display = 'block'
    } else {
        button.classList.remove('sett-active')
        settingsState = false
        MainWindow()
    }
}

function MainWindow() {
    saveData()
    document.getElementById('backdrop').classList.remove('darkenBG')
    document.getElementById('settings').style.display = 'none'
    document.getElementById('servers').style.display = 'none'
}

async function Servers() {
    var button = document.getElementById('serr')
    if (!serversState) {
        document.getElementById('settings').style.display = 'none'
        document.getElementById('sett').classList.remove('sett-active')
        settingsState = false
        button.classList.toggle('sett-active')
        serversState = true

        document.getElementById('backdrop').classList.add('darkenBG')
        document.getElementById('servers').style.display = 'block'
    } else {
        button.classList.toggle('sett-active')
        serversState = false
        MainWindow()
    }
}

async function LogOut() {
    ipcRenderer.send('LogOut')
}

async function GetSettings() {
    var settingsPATH = await GetSettingsPATH()
    try {
        if (fs.existsSync(settingsPATH)) {
            let settings = JSON.parse(fs.readFileSync(settingsPATH, 'utf8'))
            return settings
        } else {
            return null
        }
    } catch (err) {
        console.error(err)
        return null
    }
}

async function GetSettingsPATH() {
    var roaming = await ipcRenderer.invoke('getRoaming')
    var settingsPATH = path.join(
        roaming,
        'itom\\Preferences.json'
    )
    console.log(settingsPATH)
    return settingsPATH
}

async function GetToken() {
    token = await ipcRenderer.invoke('getToken')
    if (token == 'null') document.getElementById('play').innerHTML = 'войти'
}

async function CloseApp() {
    await saveData()
    ipcRenderer.send('CloseClick')
}

function MinApp() {
    ipcRenderer.send('MinClick')
}

function openBrowser(url) {
    ipcRenderer.send('OpenBrowser', url)
}

async function LaunchMinecraft() {
    if (token != 'null') {
        await saveData()
        ipcRenderer.send('LaunchClick', settings[selectedGame].ram)
    } else {
        ipcRenderer.send('Authorize')
    }
}

function OpenResources() {
    ipcRenderer.send('OpenResources')
}

function OpenMods() {
    ipcRenderer.send('OpenMods')
}
