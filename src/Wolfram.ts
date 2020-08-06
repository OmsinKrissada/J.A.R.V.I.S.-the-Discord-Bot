// import { Message } from "discord.js";

import { Message } from "discord.js";

const token = require('../token.json').wolfram;
const Util = require('./Util')

const { MessageEmbed, MessageAttachment } = require('discord.js')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function httpGetAsync(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}

class WolframInterface {


    async getShort(input: string, message: Message) {

        console.log(`Wolfram: going to send as ${input.replace(/\+/g, '%2B')}`)
        let output = httpGet(`https://api.wolframalpha.com/v1/result?i=${input.replace(/\+/g, '%2B')}&appid=${token}`)
        console.log(output);
        if (output != 'Wolfram|Alpha did not understand your input') {
            message.channel.send(new MessageEmbed()
                .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
                .setDescription(`**Answer:** ${output}\n\n${message.author}`)
                .setColor(Util.green)
                .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
            );
        }
        else {
            message.channel.send(new MessageEmbed()
                .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
                .setDescription(`Cannot recognize your question, try with less ambiguous phrases.\n\n${message.author}`)
                .setColor(Util.red)
            );
        }


    }

    async getSimple(input, message) {
        console.log(`Wolfram: going to send as "${input}"`)
        let img = new MessageAttachment(`https://api.wolframalpha.com/v1/simple?i=${input}&appid=${token}`, "result.png");
        message.channel.send(new MessageEmbed()
            .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
            .setColor(Util.green)
            .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
            .attachFiles(img)
            .setImage('attachment://result.png')
        ).then(console.log);
    }

}

export let Wolfram = new WolframInterface;