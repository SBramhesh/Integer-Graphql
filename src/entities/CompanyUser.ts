import { ObjectType, Field, registerEnumType, Int, Float } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Ticket } from "./Ticket";

export enum CompanyUserRole {
  PROJECT_MANANGER,
  CONSTRUCTION_MANAGER,
  CONSTRUCTION_PM,
  INTEGRATION_PM,
  IX_COORDINATOR
}

export enum TelMarket {
  UPNY,
  NEW_ENGLAND,
  UPSTATE_NY,
  OHIO_PENN,
  EPA,
  WVA,
}

registerEnumType(TelMarket, {
  name: "Telecom Markets", // this one is mandatory
  description: "Different Telecom markets in the US", // this one is optional
});

registerEnumType(CompanyUserRole, {
  name: "UserRole", // this one is mandatory
  description: "The basic company user roles", // this one is optional
});

@ObjectType()
@Entity()
export class CompanyUser extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  firstname!: string;

  @Field()
  @Column({ unique: true })
  lastname!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field(() => Int)
  @Column({ nullable: true })
  reportsTo: number;

  @Field(() => Float)
  @Column({ nullable: true })
  mobile: number;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({nullable: true, default:1})
  status!: number;

  @Field()
  @Column("enum", { name: "market", enum: TelMarket })
  market: TelMarket;

  @Field({ nullable: true })
  @Column({default:1})
  creatorId: number;

  // @Field(() => CompanyUserRole)
  // @Column({
  //   type: "enum",
  //   enum: CompanyUserRole,
  //   default: CompanyUserRole.INTEGRATION_PM,
  // })
  // croles: CompanyUserRole;

  @Field({nullable:true})
  @Column({default:1})
  croles: number;

  @OneToMany(() => Ticket, (ticket) => ticket.companycreator)
  tickets: Ticket[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
