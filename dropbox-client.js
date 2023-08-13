var REDIRECT_URI = 'https://scazzumvivendi.github.io/genowrite2/index.html';
var CLIENT_ID = 'dbabu374d69t7oz';
var dbxAuth = new Dropbox.DropboxAuth({
    clientId: CLIENT_ID,
});
var accessToken = localStorage.getItem("accessToken");

// Parses the url and gets the access token if it is in the urls hash
function getCodeFromUrl() {
    return utils.parseQueryString(window.location.search).code;
}

// If the user was just redirected from authenticating, the urls hash will
// contain the access token.
function hasRedirectedFromAuth() {
    return !!getCodeFromUrl();
}

function doAuth() {
    dbxAuth.getAuthenticationUrl(REDIRECT_URI, undefined, 'code', 'offline', undefined, undefined, true)
        .then(authUrl => {
            sessionStorage.setItem("codeVerifier", dbxAuth.codeVerifier);
            window.location.href = authUrl;
        })
        .catch((error) => console.error(error));
};

if (accessToken) {
    dbxAuth.setAccessToken(accessToken);
} else if (hasRedirectedFromAuth()) {
    dbxAuth.setCodeVerifier(window.sessionStorage.getItem('codeVerifier'));
    dbxAuth.getAccessTokenFromCode(REDIRECT_URI, getCodeFromUrl())
        .then((response) => {
            localStorage.setItem("accessToken", response.result.access_token);
        })
        .catch((error) => {
            console.error(error.error || error);
        });
}

function getGenowriteDropboxState() {
    var accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        console.error("No access token provided!");
        return;
    }
    dbxAuth.setAccessToken(accessToken);
    var dbx = new Dropbox.Dropbox({
        auth: dbxAuth
    });
    return dbx.filesDownload({ path: '/status.json' })
        .then(function (data) {
            return data.result.fileBlob.text()
        })
        .catch(function (error) {
            if ((error.error_summary && error.error_summary.contains("token"))) {
                localStorage.removeItem("accessToken");                        
            }
        });

}

function setGenowriteDropboxState(state) {
    var accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        console.error("No access token provided!");
        return;
    }
    dbxAuth.setAccessToken(accessToken);
    var dbx = new Dropbox.Dropbox({
        auth: dbxAuth
    });
    fileState = new File([state], "status.json")
    dbx.filesGetMetadata({ path: '/status.json' })
        .then(function (response) {
            console.log("got filesGetMetadata response:");
            console.log(response);

            // saving the current rev for the file:
            var rev = response.result.rev;
            return rev
        })
        .then(function (rev) {    
            dbx.filesUpload({ path: '/status.json', contents: fileState, mode: { '.tag': 'update', 'update': rev } })
                .then(function (data) {
                    console.log("SEND STATUS OK")
                    return data;
                })               
        })
        .catch(function (error) {
            console.error(error.error || error);
            if ((error.error_summary && error.error_summary.contains("token"))) {
                localStorage.removeItem("accessToken");                        
            }
        });

}