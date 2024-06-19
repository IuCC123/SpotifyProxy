const nmp = require('minecraft-protocol');
const states = nmp.states;
const request = require("request");
const http = require('https');
const fs = require('fs');
const config = require('./config.json');

var interv = [];

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
            if(meta.name == 'chat_message'){
                if(data.message.startsWith('!')){
                    if(data.message == "!start"){
                        startLyrics()
                        console.log('Lyrics started, make sure its synced correctly!')
                        return;
                    }
                    if(data.message == "!stop"){
                        interv.forEach(function(interval){
                            try{
                                clearInterval(interval)
                            }
                            catch{
                                clearTimeout(interval)
                            }
                        })
                        return;
                    }
                    
                }
            }
            client.write(meta.name, data)
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

    const requestOptionsSeek = {
        method: "PUT",
        headers: myHeaders,
        redirect: "follow"
    };
    
    await fetch("https://api.spotify.com/v1/me/player/play", requestOptions).then(async () => {
        await fetch("https://api.spotify.com/v1/me/player/seek?position_ms=0", requestOptionsSeek).then(async () => {
            await fetch("https://api.spotify.com/v1/me/player/currently-playing", requestOptions)
            .then(async function (response) {
                await response.json().then(async function(response){
                    currentlyPlaying = response
                    var artists = [];
                    currentlyPlaying.item.artists.forEach(function(artist){
                        artists.push(artist.name)
                    })
                    toShow = {
                        text: { type: "compound", value: { text: { type: "string", value: "Now syncing " + currentlyPlaying.item.name + " by: " + artists.join(', ') }, color: { type: "string", value: "light_purple" }} }
                    }
                    serverClient.write('action_bar', toShow);
                    download("https://spotify-lyrics-api-pi.vercel.app/?trackid=" + currentlyPlaying.item.id + "&format=lrc", "lyrics.lrc", async function(){
                        try{
                            var lyrics = fs.readFileSync('lyrics.lrc', 'utf-8');
                            JSON.parse(lyrics).lines.forEach(function(line){
                                var minutes = line.timeTag.split(':')[0]
                                var seconds = line.timeTag.split(':')[1]
                                var ms = minutes*60000 + seconds*1000
                                interv.push(setTimeout(() => {
                                    toShow = {
                                        text: { type: "compound", value: { text: { type: "string", value: line.words }, color: { type: "string", value: "light_purple" }} }
                                    }
                                    serverClient.write('action_bar', toShow);
                                }, ms-100));
                            })
                        }
                        catch(e){
                            return console.log('Unknown error, try a different song.', e)
                        }
                    })
                    interv.push(setInterval(() => {
                        if(toShow){
                            if (serverClient.state === states.PLAY && serverClient.state === states.PLAY) {
                                serverClient.write('action_bar', toShow);
                            }
                        }
                    }, 100));
                })
                interv.push(setTimeout(() => {
                    startLyrics()
                }, currentlyPlaying.item.duration_ms));
            })
        })
    })
}

const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest);

    const request = http.get(url, (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
        response.pipe(file);
    });

    file.on('finish', () => file.close(cb));

    request.on('error', (err) => {
        fs.unlink(dest, () => cb(err.message));
    });

    file.on('error', (err) => {
        fs.unlink(dest, () => cb(err.message));
    });
};