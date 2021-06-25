import { InputType, Field } from "type-graphql";
import {CompanyUserRole, TelMarket } from "../entities/CompanyUser"
@InputType()
export class CompanyUsernamePasswordInput {
  @Field()
  cemail: string;
  @Field()
  firstname: string;
  @Field()
  lastname: string;
  @Field()
  mobile: number;
  @Field()
  croles: CompanyUserRole;
  @Field()
  cmarket: TelMarket;
  @Field()
  password: string;
}