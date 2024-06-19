const nmp = require('minecraft-protocol');
const states = nmp.states;
const request = require("request");
const config = require('./config.json');

var serverClient;
var toShow;
var accessToken;

var refreshtoken = config.refresh_token;

var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(config.client_id + ':' + config.client_secret).toString('base64')) },
    form: {
        grant_type: 'refresh_token',
        refresh_token: refreshtoken
    },
    json: true
};

setInterval(() => {
    if(!accessToken){
        request.post(authOptions, function(error, response, body) {
            accessToken = body.access_token;
        });
    }
}, 100);

var host = config.target_host;
var port = config.target_port;

const server = nmp.createServer({
    host: config.proxy_host,
    port: config.proxy_port,
    version: '1.20.4',
    "online-mode": false
})

server.on('listening', () => {
    console.log(`Listening for connections, please join ${config.proxy_host}:${config.proxy_port} on 1.20.4`)
})

server.on("playerJoin", function(player){
    console.log('Connection recieved!')
    var client = nmp.createClient({
        host: host,
        port: port,
        username: config.username,
        version: "1.20.4"
    })
    serverClient = player;
    client.on('packet', function(data, meta){
        if (client.state === states.PLAY && meta.state === states.PLAY) {
            serverClient.write(meta.name, data);
        }
    })
    serverClient.on('packet', function(data, meta){
        if (serverClient.state === states.PLAY && meta.state === states.PLAY) {
            client.write(meta.name, data)
            if(meta.name == 'chat_message'){
                if(data.message.startsWith('!')){
                    if(data.message == "!start"){
                        startLyrics()
                        console.log('Lyrics started, make sure its synced correctly!')
                        return;
                    }
                }
            }
        }
    })
})


var currentlyPlaying;
async function startLyrics(){
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer "+accessToken);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    await fetch("https://api.spotify.com/v1/me/player/currently-playing", requestOptions)
    .then(async function (response) {
        await response.json().then(async function(response){
            currentlyPlaying = response
            await fetch("https://spclient.wg.spotify.com/color-lyrics/v2/track/"+currentlyPlaying.item.id+"/image/https%3A%2F%2Fi.scdn.co%2Fimage%2Fab67616d0000b2739565c4df27be4aee5edc8009?format=json&vocalRemoval=false&market=from_token", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
                    "Accept": "application/json",
                    "Accept-Language": "en",
                    "app-platform": "WebPlayer",
                    "spotify-app-version": "1.2.41.162.g8acb5474",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site",
                    "authorization": "Bearer " + config.lyrics_auth,
                    "client-token": config.lyrics_client_token,
                },
                "method": "GET",
                "mode": "cors"
            })
            .then(async function(res){
                try{
                    await res.json().then(function(json){
                        var result = json;
                        result.lyrics.lines.forEach(function(line){
                            setTimeout(() => {
                                toShow = {
                                    text: { type: "compound", value: { text: { type: "string", value: line.words }, color: { type: "string", value: "light_purple" }} }
                                }
                                serverClient.write('action_bar', toShow);
                            }, parseInt(line.startTimeMs));
                        })
                    })
                }
                catch(e){
                    return console.log('Unknown error, try a different song.', res, e)
                }
            })
            setInterval(() => {
                if(toShow){
                    if (serverClient.state === states.PLAY && serverClient.state === states.PLAY) {
                        serverClient.write('action_bar', toShow);
                    }
                }
            }, 100);
        })
        setTimeout(() => {
            startLyrics()
        }, currentlyPlaying.item.duration_ms);
    })
}