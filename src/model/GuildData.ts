import mongoose from "mongoose";

export interface IGuildData {
  name: string;
  prefix: string;
  dm: boolean;
  hooks: Array<Object>;
}

const guildData = new mongoose.Schema({
  id: { type: Number },
  prefix: { type: String, default: "!" },
  dm: { type: Boolean },
  settings: {
    warnUnknownCommand: { type: Boolean, default: true },
    announceSong: { type: Boolean, default: true },
    announceQueueEnd: { type: Boolean, default: false }
  },
  hooks: [{
    text: { type: String },
    voice: { type: String },
    type: { type: String }
  }]
})

export let GuildData = mongoose.model("guild_options", guildData)
