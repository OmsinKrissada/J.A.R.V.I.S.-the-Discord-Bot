// import { Message } from "discord.js";

import { Message } from "discord.js";

import { Helper } from './Helper';
import { MessageEmbed, MessageAttachment } from 'discord.js';
import { XMLHttpRequest } from "xmlhttprequest"
import { CONFIG } from "./ConfigManager";

const apitoken = CONFIG.token.wolfram;

function httpGet(theUrl: string) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

class WolframInterface {


    async getShort(input: string, message: Message) {

        console.log(`Wolfram: going to send as ${input.replace(/\+/g, '%2B')}`)
        const output = httpGet(`https://api.wolframalpha.com/v1/result?i=${input.replace(/\+/g, '%2B')}&appid=${apitoken}`)
        console.log(output);
        if (output != 'Wolfram|Alpha did not understand your input') {
            message.channel.send(new MessageEmbed()
                .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
                .setDescription(`**Answer:** ${output}\n\n${message.author}`)
                .setColor(Helper.GREEN)
                .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
            );
        }
        else {
            message.channel.send(new MessageEmbed()
                .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
                .setDescription(`Cannot recognize your question, try with less ambiguous phrases.\n\n${message.author}`)
                .setColor(Helper.RED)
            );
        }


    }

    async getSimple(input, message) {
        console.log(`Wolfram: going to send as "${input}"`)
        const img = new MessageAttachment(`https://api.wolframalpha.com/v1/simple?i=${input}&appid=${apitoken}`, "result.png");
        message.channel.send(new MessageEmbed()
            .setAuthor(`Q: ${input}`, message.author.displayAvatarURL())
            .setColor(Helper.GREEN)
            .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
            .attachFiles([img])
            .setImage('attachment://result.png')
        ).then(console.log);
    }

}

export const Wolfram = new WolframInterface();