# **J.A.R.V.I.S. *Discord Bot***

A Discord bot using [discord.js](https://discord.js.org) module in node.js

# About
### Purpose:
I originally created this bot intended for my personal use.

But since it's already quite become a thing and I don't want it to just sit around doing nothing on my hard drive, I decided to publish it, so there's a possibility that someone might find it useful (maybe for who want to get started, this could be an example).

### Core Features:
- Ranker (I do not own this, information [below](#disclaimer))
- Morse Code <-> English Translator
- Link chats and player join/leave events with minecraft via a [plugin](https://github.com/OmsinKrissada/ChatLinker)

*Yea, that's pretty much it. Not quite useful at the moment -.-*

# Prerequisites:
- [node.js](https://nodejs.org/en/download/) (obviously... with *npm* installed)

# Getting Started
### Installation
1. Clone this repository and cd into it
   ```
   git clone https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot.git
   cd J.A.R.V.I.S.-the-Discord-Bot
   ```

2. install all dependencies required for the bot by running (in terminal)
   ```
   npm install --production
   ```
   More info about the discord.js library [here](https://discord.js.org/#/)

3. (Optional) Install **recommended packages** below:
   * nodemon (Info [below](#run-using-my-recommendation))
   * [Python 3.x](https://www.python.org/downloads/)

**Note:** In order for `Ranker` and `Morse Code Translator` to work properly, **Python 3.x is required**

### Getting it online:

You need to get a *token* from discord to get it online.

In order to do that, please visit [Discord API Website](https://discordapp.com/developers).

Then save your token in the main directory (where index.js is located) as a file called `token` **(without file extension)!!!**

##### If you're ready, you can now run
```
npm start
```

**OR**

##### Run using my recommendation
I recommend using **nodemon** to restart the bot automatically whenever the code is modified.
**Install nodemon** and other development packages from *devDependencies* by running
```
npm install --dev
```
and now you can **start it** by running
```
npm run dev
```

---
## Disclaimer:
I'm ***not*** the author of `item-ranker.py`, credit goes to [**voidweaver**](https://github.com/voidweaver).

The original source of the file is available in [this repository](https://github.com/voidweaver/item-ranker)
