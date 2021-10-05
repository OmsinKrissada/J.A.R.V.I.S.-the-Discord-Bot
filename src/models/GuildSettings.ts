import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity({ synchronize: true })
export class GuildSettings {

  @PrimaryColumn({ unique: true, type: "varchar", length: 18 })
  id: string;

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