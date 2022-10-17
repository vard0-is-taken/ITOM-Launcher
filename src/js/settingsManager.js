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

init()

async function init() {
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