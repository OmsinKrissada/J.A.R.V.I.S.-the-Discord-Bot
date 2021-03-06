// import { Emoji } from "discord.js";
// import mongoose, { Document, Schema } from "mongoose";

// class VoiceHook {
//   type: string;
//   voiceChannel: string;
//   textChannel: string;
// }

// /*
//  * Please keep IGuildData and the following schema in-synced
//  * Hope you won't miss it :)
//  */

// export interface IGuildData extends Document {

//   settings: {
//     warnUnknownCommand: boolean;
//     announceSong: boolean;
//     announceQueueEnd: boolean;
//     queueInOrder: boolean;
//     enforceUserLimit: boolean;
//   }
//   music: {
//     volume: number;
//   },
//   rolePanels: Map<string, {
//     messageId: string;
//     roles: {
//       emojiId: string;
//       roleId: string;
//     }[]
//   }>
//   hooks: VoiceHook[];
//   polls: string[];
// }

// const guildData = new mongoose.Schema({
//   ID: { type: String },
//   name: { type: String },
//   prefix: { type: String, default: "!" },
//   dm: { type: Boolean },
//   settings: {
//     warnUnknownCommand: { type: Boolean, default: true },
//     announceSong: { type: Boolean, default: true },
//     announceQueueEnd: { type: Boolean, default: false },
//     queueInOrder: { type: Boolean, default: true },
//     enforceUserLimit: { type: Boolean, default: false },
//   },
//   music: {
//     volume: { type: Number },
//   },
//   rolePanels: {
//     type: Map,
//     of: new Schema({
//       messageId: String,
//       roles: [{
//         emojiId: String,
//         roleId: String,
//       }]
//     }),
//     default: new Map()
//   },
//   hooks: [{
//     text: { type: String },
//     voice: { type: String },
//     type: { type: String }
//   }],
//   polls: [{ type: String }],
// })

// export const Guilds = mongoose.model<IGuildData>("guilds", guildData)










import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity({ synchronize: true })
export class GuildSettings {

  @PrimaryColumn({ unique: true, type: "varchar", length: 18 })
  id: string;

  @Column()
  name: string;

  @Column({ default: '-' })
  prefix: string;

  @Column()
  isDMChannel: boolean;

  @Column({ default: true })
  warnUnknownCommand: boolean;

  @Column({ default: true })
  announceSong: boolean;

  @Column({ default: false })
  announceQueueEnd: boolean;

  @Column({ default: true })
  queueInOrder: boolean;

  @Column({ default: false })
  enforceUserLimit: boolean;
}