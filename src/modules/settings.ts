import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import { Command } from "../CommandManager";
import { getGuildSettings, setGuildSettings } from "../DBManager";
import * as Helper from "../Helper";
import { bot } from "../Main";

new Command({
  name: "settings",
  category: "settings",
  description: "Modifies bot's settings",
  examples: ["settings <settings> <value>", "settings <settings>"],
  requiredCallerPermissions: ["MANAGE_GUILD"],
  requiredSelfPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "VIEW_CHANNEL"],
  serverOnly: true,
  async exec(message, prefix, args, sourceID) {
    const settings_name = await getGuildSettings(message.guild.id);
    const settingsdesc = {
      warnUnknownCommand: "Warns when the bot receives an unknown command.",
      announceSong: "Announces when a song is being played.",
      announceQueueEnd: "Announces when music queue is ended.",
      queueInOrder: "Use sync method to get videos from playlist. (EXPERIMENTAL)",
      enforceUserLimit: "Kicks users when joining a voice channel that exceed the user limit regardless of the permission they have. (Requires MOVE_MEMBER permission)",
      saveMusicHistory: "Whether to save music requests.",
    };

    const field = args[0];
    const value = args[1]?.toLowerCase();
    if (field in settingsdesc) {
      let embedOptions: MessageEmbedOptions;
      if (!value) {
        embedOptions = {
          description: `Current value: \`${settings_name[field]}\``,
          color: Helper.BLUE,
        };
      } else if (["true", "on", "yes", "enable", "1"].includes(value)) {
        const oldval = settings_name[field];
        await setGuildSettings(sourceID, { [field]: true });
        embedOptions = {
          title: "Setting Applied",
          description: `${oldval ? "<:checkmark:849685283459825714>" : "<:empty:849697672884650065>"} <:join_arrow:845520716715917314> <:checkmark:849685283459825714> \`${field}\``,
          color: Helper.GREEN,
        };
      } else if (["false", "off", "no", "disable", "0"].includes(value)) {
        const oldval = settings_name[field];
        await setGuildSettings(sourceID, { [field]: false });
        embedOptions = {
          title: "Setting Applied",
          description: `${oldval ? "<:checkmark:849685283459825714>" : "<:empty:849697672884650065>"} <:join_arrow:845520716715917314> <:empty:849697672884650065> \`${field}\``,
          color: Helper.GREEN,
        };
      } else {
        embedOptions = {
          description: `Invalid value`,
          color: Helper.RED,
        };
      }
      message.channel.send(new MessageEmbed(embedOptions));
    } else {
      const embed_fields: any[] = [];
      for (const setting in settings_name) {
        if (setting in settingsdesc && setting != "toString") {
          embed_fields.push({
            name: settingsdesc[setting],
            value: (settings_name[setting] ? "<:checkmark:849685283459825714> " : "<:empty:849697672884650065>") + " `" + setting + "`\n" + Helper.ZERO_WIDTH,
            inline: false,
          });
        }
      }

      const embed = new MessageEmbed({
        author: { name: "My Settings", iconURL: "https://cdn.discordapp.com/emojis/849696436483391519.png?v=1" },
        description: `Use \`${prefix}settings <setting> <true/false>\` to change their values.\n**Example**: \`${prefix}settings warnUnknownCommand false\``,
        color: Helper.BLUE,
        fields: embed_fields,
      });
      message.channel.send(embed);
    }
  },
});
