// import { Message } from "discord.js";

const token = require('../token.json').wolfram;
const Util = require('./Util')

const WolframAlphaAPI = require('wolfram-alpha-api');
const wa = WolframAlphaAPI(token);
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


    async getShort(input, message) {
        // console.log(`Wolfram: going to send as ${input}`)
        // let output;
        // output = await wa.getShort(input).catch(message.channel.send(new MessageEmbed()
        //     .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
        //     .setDescription(`Cannot recognize your question, try with less ambiguous phrases.`)
        //     .setColor(0xff0000)
        // ))
        // console.log(output);
        // message.channel.send(new MessageEmbed()
        //     .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
        //     .setDescription(`**Answer:** ${output}`)
        //     .setColor(0x00ff00)
        //     .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
        // )

        console.log(`Wolfram: going to send as ${input}`)
        let output = httpGet(`https://api.wolframalpha.com/v1/result?i=${input}&appid=${token}`)
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

    async getFull(input, message) {
        console.log(`Wolfram: going to send as "${input}"`)
        // let out =
        //     await wa.getFull(input).then((queryresult) => {
        //         const pods = queryresult.pods;
        //         const output = pods.map((pod) => {
        //             const subpodContent = pod.subpods.map(subpod =>
        //                 `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
        //             ).join('\n');
        //             message.channel.send(subpodContent)
        //             return `<h2>${pod.title}</h2>\n${subpodContent}`;
        //         }).join('\n');
        //         console.log(output);
        //         message.channel.send(output)
        //     }).catch(console.error);
        // console.log(out);
        await wa.getFull({ input: input, output: 'json', format: 'image' }).then((queryresult) => {
            console.log(queryresult);
            message.channel.send(queryresult);
        })
        message.reply(output);
    }

    async getSimple(input, message) {
        // let token = 'DEMO';
        console.log(`Wolfram: going to send as "${input}"`)
        // let output = await wa.getSimple(input);
        let img = new MessageAttachment(`https://api.wolframalpha.com/v1/simple?i=${input}&appid=${token}`, "result.png");
        // console.log(output);
        message.channel.send(new MessageEmbed()
            .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
            .setColor(Util.green)
            .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
            .attachFiles(img)
            .setImage('attachment://result.png')
            //https://api.wolframalpha.com/v1/simple?i=Who+is+the+prime+minister+of+India%3F&appid=DEMO
        ).then(console.log);
        // console.log(`received, got ${img}`)
        // console.log(img.;
    }

    async getSpoken(input, message) {
        console.log(`Wolfram: going to send as ${input}`)
        let output = await wa.getSpoken(input);
        console.log(output);
        message.reply(output);
    }

}

let Wolfram = new WolframInterface;
module.exports = Wolfram;