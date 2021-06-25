import {
  ObjectType,
  InputType,
  Field,
  Int,
  registerEnumType,
  InterfaceType,
  Float,
} from "type-graphql";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { User } from "./User";
import { Updoot } from "./Updoot";
import { json, text } from "express";
import { CompanyUser } from "./CompanyUser";

enum TelMarket {
  UPNY, NEW_ENGLAND, UPSTATE_NY, OHIO_PENN, EPA, WVA
}

export enum ActivityCode {
    IxSupport = "IxSupport",
    CxSupport ="CxSupport",
    FInt = "FI",
    FInst = "FInst",
    RI  ="RI",
  }

  // export enum ActivityCode {
  //   IxSupport ,
  //   CxSupport ,
  //   FInt ,
  //   FInst ,
  //   RI  ,
  // }

@InterfaceType()
abstract class paceptn {
  @Field()
  pace: string;

  @Field()
  ptn: string;
}

@ObjectType()
 export class Paceptn  {
  @Field()
  pace: string;
  @Field()
  ptn: string;
}

@InterfaceType()
 abstract class activitiesInt {
  @Field()
  IsTrue: boolean;

  @Field(() => ActivityCode)
  activity: ActivityCode;
}

// @ObjectType()
// export   class ActivitiesInt {
//   @Field()
//   IsTrue: boolean;

//   @Field(() => ActivityCode)
//   activity: ActivityCode;
// }

registerEnumType(ActivityCode, {
  name: "ActivityCode", // this one is mandatory
  description: "Types of Activities supported", // this one is optional
});

registerEnumType(TelMarket, {
  name: "Telecom Markets", // this one is mandatory
  description: "Different Telecom markets in the US", // this one is optional
});


@ObjectType()
@Entity()
export class Ticket extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  falocation!: string;

  @Field()
  @Column()
  sitename!: string;

  @Field()
  @Column()
  siteid!: string;
   
  @Field({nullable:true})
  @Column({nullable: true})
  threegsiteid: string;

  @Field(() => Float)
  @Column({ type: "float", default: 0 })
  latitude!: number;

  @Field(() => Float)
  @Column({ type: "float", default: 0 })
  longitude!: number;

  @Field(() => String, { nullable: true })
  @Column({nullable: true, type: "text"})
  address1: string | null;

  @Field(() => String, { nullable: true })
  @Column({nullable: true, type: "text"})@Field()
  address2: string | null;

  @Field()
  @Column()
  zipcode: number;

  @Field()
  @Column("enum", { name: "market", enum: TelMarket })
  market: TelMarket;

  // pace ptn stored as an array of json  objects

  @Field(() => [Paceptn])
  @Column("jsonb", {  nullable: true})
  tickets: Paceptn[];

  @Field()
  @Column({nullable:true})
  noOfTickets: number;

  @Field()
  @Column({nullable: true})
  scopeofwork: string;

  @Field()
  @Column({nullable: true})
  keycomments: string;

  @Field()
  @Column({type: "text", nullable: true})
  noticecomments: string;

  @Field({nullable: true})
  @Column()
  fivegixcomments: string | null;

  //activities currently stored as an array of json objects consisting
  //of the enum and boolean
  @Field(type => [ActivityCode], {nullable: true})
  @Column("jsonb", {  nullable: true})
  // @Column("enum", { name: "activities",array: true,nullable:true, enum: ActivityCode })
  activities: ActivityCode[];

  @Field()
  @Column({ type: "date", nullable: true })
  calltestdate: Date;

  @Field()
  @Column({ type: "date" })
  fivegixscheduledate: Date;

  @Field()
  @Column({ type: "date" })
  crewdispatchdate: Date;

  @Field()
  @Column({ type: "date" })
  ixscheduledate: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.tickets)
  creator: User;

  @Field(() => CompanyUser)
  @ManyToOne(() => CompanyUser, (companyuser) => companyuser.tickets)
  companycreator: CompanyUser;

  @Field()
  @Column()
  creatorId: number;

  @Field({nullable: true})
  @Column({nullable: true})
  assignedfe: number;

 @Field()
  @Column({nullable: true})
  assignedgc: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
