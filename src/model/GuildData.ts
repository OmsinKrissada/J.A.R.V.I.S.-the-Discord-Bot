import mongoose, { Document } from "mongoose";

export interface IGuildData extends Document {
  ID: string;
  name: string;
  prefix: string;
  dm?: boolean;
  settings?: {
    warnUnknownCommand: boolean;
    announceSong: boolean;
    announceQueueEnd: boolean;
  }
  hooks?: [
    {
      text: string;
      voice: string;
      type: string;
    }
  ] | []
}

const guildData = new mongoose.Schema({
  ID: { type: String },
  name: { type: String },
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

export const Guilds = mongoose.model<IGuildData>("guilds", guildData)
