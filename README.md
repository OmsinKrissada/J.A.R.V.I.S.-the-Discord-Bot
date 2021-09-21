# **J.A.R.V.I.S. _Discord Bot_**

A Discord bot using [discord.js](https://discord.js.org) module in Node.js

# About

### Purpose:

I originally created this bot intended for my personal use.

~~But since it's already quite become a thing and I don't want it to just sit around doing nothing on my hard drive, I decided to publish it, so there's a possibility that someone might find it useful (maybe for who want to get started, this could be an example).~~ That was a year ago and I was so bad at JS/TS. I also wasn't concern enough about bot/user permissions. Don't use this as an example of how to implement a Discord bot 😢

### Core Features:

-   Simple music bot with Spotify support (only Spotify tracks atm)
-   Migrate members from a voice channel to another.
-   Answer your questions using WolframAPI. (This requires a Wolfram token)
-   Get details of a user or a server.
-   Link Text and Voice channels
-   Show last time a user visit a voice channel (please acknowledge your server members about this since this can be a privacy issue)

_Yea, that's pretty much it. Not quite useful at the moment -.-_

# Prerequisites:

-   [Node.js](https://nodejs.org/en/download/) (v15 and above is required)
-   Access to a Lavalink server (for music feature, optional but must set in config)
-   Access to a MySQL server (optional)
-   WolframAPI token (optional, if you want to enable the use of `-ask` command)
-   Spotify `CLIENT_ID` and `CLIENT_SECRET` (optional, for Spotify support)

# Getting Started

### Installation

1. Clone this repository and `cd` into it.

    ```sh
    git clone https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot.git
    cd J.A.R.V.I.S.-the-Discord-Bot
    ```

2. Install dependencies required for the bot.

    ```sh
    npm install --production
    ```

    More info about the discord.js library [here](https://discord.js.org/#/).

3. (Optional) Install **recommended packages** below:
    - nodemon (Info [below](#run-using-my-recommendation))

### Getting it online:

You need to get a _token_ from discord to get it online.

In order to do that, please visit [Discord API Website](https://discordapp.com/developers).

For music feature you'll also need YouTube's token.

Create `config.yml` in the main directory(same place with `package.json`) using this template:

```yaml
token:
    discord: "xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxx-xxxxxxxxxxxxxxxxxxxx"
    wolfram: "xxxxxx-xxxxxxxxx"
    youtube: "xxxxxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxx"
    spotify_id: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    spotify_secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Change to MySQL if you encounter some problems (probably with timezones)
database: sqlite

mysql:
    hostname: example.com
    port: 3306
    database: jarvis
    authorizationEnabled: false
    username: jarvis
    password: password

sqlite:
    path: jarvis.db

lavalink:
    hostname: lava.link
    password: password
    port: 80 # (The default port for Lavalink is 2333 but lava.link is a free lavalink server which for some reason liston on port 80)

defaultPrefix: "!"
defaultDMPrefix: ""
defaultVolume: 50

colors:
    red: 0xff0000
    green: 0x04CF8D
    blue: 0x28BAD4
    yellow: 0xebc934
    aqua: 0x34ebbd

# Bot will send a message to this channel on login and logout
loggingChannel: "<channel id here (optional)>"
# Songs playing in every server will be paused when the device exceed this CPU percent limit
maxCPUPercent: 90
# Disable music functionality (will not connect to Lavalink server)
disableMusic: false
```

#### If you're ready, you can now run

```
npm run build
```

then

```
npm start
```

**OR**

#### Run using my recommendation (if you wish to modify the code)

I recommend using **nodemon** to restart the bot automatically whenever the code is modified.
**Install nodemon** and other development packages from _devDependencies_ by running

```sh
npm install --dev
```

and now you can **start it** by running

```sh
npm run dev
```
