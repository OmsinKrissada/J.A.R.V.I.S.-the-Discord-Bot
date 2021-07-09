import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ synchronize: true })
export class ChannelHooks {

  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", length: 18 })
  textChannel_id: string;

  @Column({ type: "varchar", length: 18 })
  voiceChannel_id: string;

  @Column({ type: "varchar", length: 18 })
  guild_id: string;

}