# **J.A.R.V.I.S. *Discord Bot***



A Discord bot using [discord.js](https://discord.js.org) module in node.js
# About
## Purpose:
I originally created this bot intended for my personal use.

But since it's already quite become a thing and I don't want it to just sitting around doing nothing on my harddrive. I decided to publish it, so there's a possibility that someone might find it useful (maybe for who want to get started, this could be an example)
## Core Features:
- Ranker (I do not own this, information [below](#disclaimer))
- Morse Code <-> English Translator
- Link chats and player join/leave events with minecraft via a [plugin](https://github.com/OmsinKrissada/ChatLinker)

*yea, that's pretty much it. Not quite useful at the moment -.-*
# Installation
## Prerequisites:
- [node.js](https://nodejs.org/en/download/) (obviously... with *npm* installed)

And install **discord.js** module by running (in terminal)
```
npm install discord.js
```
More info about the library [here](https://discord.js.org/#/)
## Recommended:
- nodemon (Info below)
- [Python 3.x](https://www.python.org/downloads/)


**Note:** In order for `Ranker` and `Morse Code Translator` to work properly, **Python 3.x is required**


---
## Get Online:

You need to get a *token* from discord to get it online.

In order to do that, please visit [Discord API Website](https://discordapp.com/developers)

Then save your token as a file in the main directory (where index.js is located) as a file called `token` **(without file extension)!!!**

If you're ready, you can basically run
```
node index.js
```

**OR**


I recommend using **nodemon** to automatically restart the bot automatically whenever the code is modified.
Then you'll need to **install nodemon** by running
```
npm install nodemon
```
and **get it online** by running
```
npm run dev
```

---
## *Disclaimer:*
I'm ***NOT*** the author of `item-ranker.py`, credit goes to [**voidweaver**](https://github.com/voidweaver).

The original source of the file is available for public in [this repository](https://github.com/voidweaver/item-ranker)

