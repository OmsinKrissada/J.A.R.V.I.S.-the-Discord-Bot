import mongoose from "mongoose";

export interface IGuildData {
  name: string;
  prefix: string;
  dm: boolean;
  hooks: Array<Object>;
}

const guildData = new mongoose.Schema({
  id: Number,
  prefix: { type: String, default: "!" },
  dm: Boolean,
  settings: {
    warnUnknownCommand: { type: Boolean, default: true },
    annouceSong: { type: Boolean, default: true }
  },
  hooks: [{
    text: String,
    voice: String,
    type: String
  }]
})

export let GuildData = mongoose.model("guild_options", guildData)
