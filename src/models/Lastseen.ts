import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ synchronize: true })
export class Lastseen {

  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", length: 18 })
  guild_id: string;

  @Column({ type: "varchar", length: 18 })
  member_id: string;

  @Column({})
  timestamp: Date;

}