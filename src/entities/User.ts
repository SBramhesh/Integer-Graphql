import { isNullableType } from "graphql";
import { ObjectType, Field, registerEnumType, Int } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Post } from "./Post";
import { Ticket } from "./Ticket";
import { Updoot } from "./Updoot";

export enum UserRole {
  ADMIN,
  MULTIPLE_M_M,
  GHOST,
  IX_MANAGER,
  CX_MANGER,
  GC,
  FE,
}

registerEnumType(UserRole, {
  name: "UserRole", // this one is mandatory
  description: "The basic user roles", // this one is optional
});

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column({ nullable: true })
  reportsTo: number;

  @Field(() => [User], {nullable: true})
  feUsers: User[]| null;

  @Column()
  password!: string;

  // @Field(() => UserRole)
  // @Column({type: "enum", array: true, enum: UserRole, default: [UserRole.GHOST]})
  // roles: UserRole[]

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];

  @OneToMany(() => Ticket, (ticket) => ticket.creator)
  tickets: Ticket[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
