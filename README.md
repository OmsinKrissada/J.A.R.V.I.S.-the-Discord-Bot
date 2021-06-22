# **J.A.R.V.I.S. _Discord Bot_**

A Discord bot using [discord.js](https://discord.js.org) module in node.js

# About

### Purpose:

I originally created this bot intended for my personal use.

But since it's already quite become a thing and I don't want it to just sit around doing nothing on my hard drive, I decided to publish it, so there's a possibility that someone might find it useful (maybe for who want to get started, this could be an example).

### Core Features:

-   Simple music bot
-   Move users between voice channels.
-   Command to get data from WolframAlphaAPI (with both text and image format).
-   Gets information about users or servers.

_Yea, that's pretty much it. Not quite useful at the moment -.-_

# Prerequisites:

-   [node.js](https://nodejs.org/en/download/) (obviously... with _npm_ installed, I recommend using 15.x)
-   Lavalink server access
-   MySQL server access (optional)

# Getting Started

### Installation

1. Clone this repository and cd into it.

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

Create `config.yml` in `settings` directory using this template:

```yaml
token:
    discord: "xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxx-xxxxxxxxxxxxxxxxxxxx"
    wolfram: "xxxxxx-xxxxxxxxx"
    youtube: "xxxxxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxx"

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
    hostname: localhost
    password: password
    port: 2333

defaultPrefix: "!"
defaultDMPrefix: ""
defaultVolume: 50

colors:
    red: 0xff0000
    green: 0x04CF8D
    blue: 0x28BAD4
    yellow: 0xebc934
    aqua: 0x34ebbd

loggingChannel: "<channel id here (optional)>"
maxCPUPercent: 90
```

#### If you're ready, you can now run

```
npm start
```

**OR**

#### Run using my recommendation

I recommend using **nodemon** to restart the bot automatically whenever the code is modified.
**Install nodemon** and other development packages from _devDependencies_ by running

```sh
npm install --dev
```

and now you can **start it** by running

```sh
npm run dev
```
