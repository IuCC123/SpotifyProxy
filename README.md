# Spotify Proxy

Spotify Proxy is a Minecraft Java proxy that lets you sync Spotify lyrics with Minecraft using the actionbar.

The proxy currently only supports offline mode servers (cracked) servers and not online mode (premium) servers.


> Get started
1. Clone the repository using `git clone https://github.com/IuCC123/SpotifyProxy` or download and unzip the respository by clicking the blue **"Code" button**.
2. Open a terminal inside of the cloned/unzipped folder and run the following command: `npm i`.
3. Duplicate (copy and paste) **config.json.example** and call it "**config.json**"
4. Go to [the spotify developer dashboard](https://developer.spotify.com/dashboard) and login with your existing Spotify account.
5. Once you have logged in, you should see a Dashboard page. Click "**Create app**" on that page to create a new application. ![](screenshots/dashboard.png)
6. Click the newly created application and click the **settings button**.
![](screenshots/settings.png)
7. Scroll down on the settings page and click the Edit button.
8. Add **http://localhost:3000/callback** to the Redirect URIs field.
9. Scroll back to the top and copy your Client ID, put the Client ID in the **client_id** field in the config.json file you created at step 3.
10. Under the Client ID field in the Spotify dashboard, click "**View client secret**" and copy the Client secre, put the Client secret in the **client_secret** field in the same config.json file.
11. Once done, run `node web` in a terminal in the directory of the repository.
12. Follow the steps in the console
13. **Copy your Refresh token** that the web application returns once you have authorized. Put this token in the **refresh_token** field in config.json
14. Now you can edit the config.json file to your likings.
15. Once you've edited the config.json file to your likings and you are at the **lyrics_auth** and **lyrics_client_token** field, you need to follow step 16.
16. Go to https://open.spotify.com and open the developer console (CTRL + Shift + I). Put the developer console on the "**Network**" tab at the top of the console. ![](screenshots/network.png)
17. Keep the developer console open and start playing a song and go to the lyrics icon if provided.
18. In the Network tab, you should see something like this (see image below)![](screenshots/network-response.png)
19. Click the **first** result of the 2 results shown in the Network tab (see image above) and scroll down to **"Request Headers**" in the Network tab.
20. You should see "**authorization**" and "**client-token**" in the request headers (see image below).![](screenshots/request-headers.png).
21. Copy these values and put the first one (a**uthorization**) in the **lyrics_auth field in the config.json file**. After that you need to put the second one (**client-token**) in the **lyrics_client_token field in the config.json file**.
22. Run `node .` and follow the steps sent in the console.
23. Once ingame, send "**!start**" in the chat and wait for the first lyric, it should appear if you synced it correctly (**_make sure to run !start at the same time as you start the Spotify song, at 0:00_**).

> If you need any help, you can always contact me by DMing me on Discord (username: **iucc.**)