
var ITOM = function ITOM(token, authFilePath, baseUrl, gamesFolderPath, progressBarFunc, isTokenLoaded) {
    this.token = token
    this.authFilePath = authFilePath
    this.baseUrl = baseUrl
    this.gamesFolderPath = gamesFolderPath
    this.progressBarFunc = progressBarFunc
    if (!isTokenLoaded) {
        saveToken(this.token, this.authPath)
    }
}

// base api url = "https://itom.fun/api/v1"
// games download url = "https://itom.fun/api/v1/gamesDL/[game]"

ITOM.prototype.downloadGame = function (game)  {
    const file = fs.createWriteStream(this.gamesFolderPath + '/' + game)
    var receivedBytes = 0
    var totalBytes = 0
    var lastSended = -1

    request
        .get(this.baseUrl + '/gamesDL/' + game)
        .on('response', (response) => {
            if (response.statusCode == 200) {
                totalBytes = response.headers['content-length']
            } else {
                return
            }
        })
        .on('data', (chunk) => {
            receivedBytes += chunk.length
            var perc = ((receivedBytes / totalBytes) * 100).toFixed(1)
            if (perc != lastSended) {
                this.progressBarFunc(perc)
                lastSended = perc
            }
        })
        .pipe(file)
        .on('error', (err) => {
            fs.unlink(path)
            gameDownloadError()
        })

    file.on('finish', () => {
        file.close()
        gameDownloadSuccess()
    })

    file.on('error', (err) => {
        fs.unlink(path)
        gameDownloadError()
    })
}

async function gameDownloadError() {
    console.log('pizdec')
    //fade percentage to 0
    //display error message
}

async function gameDownloadSuccess() {
    console.log('downloaded minecraft succesfully')
    //checksum
    //fade percentage to 0
    //reload mainWindow
}

ITOM.prototype.setToken = function (token) {
    this.token = token
    saveToken()
}
ITOM.prototype.getToken = function () {
    return this.token
}
ITOM.prototype.isLoggedIn = function () {
    return!!this.token
    // TODO: Сделать онлайн проверку токена в случае если он не равен нулю.
}
ITOM.prototype.getNickname = function () {
    if (this.isLoggedIn()) {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url:     'https://vortex-mc.site/lapi/getNickname.php',
            body:    'access_token=' + this.token
          }, function(error, response, body){
            console.log(body);
          });
    }
}

function saveToken(token = null, path = null) {
    var tokenJson = {
        token: token ? token : this.token
    }
    fs.writeFile(path ? path : this.authPath, JSON.stringify(tokenJson), function (err, result) {
        if (err) console.log('error', err)
    })
}

module.exports = ITOM