import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1623407398724 implements MigrationInterface {
    name = 'Initial1623407398724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "updoot" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_6476d7e464bcb8571004134515c" PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "text" character varying NOT NULL, "points" integer NOT NULL DEFAULT '0', "creatorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "reportsTo" integer, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "ticket_market_enum" AS ENUM('0', '1', '2', '3', '4', '5')`);
        await queryRunner.query(`CREATE TABLE "ticket" ("id" SERIAL NOT NULL, "falocation" character varying NOT NULL, "sitename" character varying NOT NULL, "siteid" character varying NOT NULL, "threegsiteid" character varying, "latitude" double precision NOT NULL DEFAULT '0', "longitude" double precision NOT NULL DEFAULT '0', "address1" text, "address2" text, "zipcode" integer NOT NULL, "market" "ticket_market_enum" NOT NULL, "tickets" jsonb, "noOfTickets" integer, "scopeofwork" character varying, "keycomments" character varying, "noticecomments" text, "fivegixcomments" character varying NOT NULL, "activities" jsonb, "calltestdate" date, "fivegixscheduledate" date NOT NULL, "crewdispatchdate" date NOT NULL, "ixscheduledate" date NOT NULL, "creatorId" integer NOT NULL, "assignedfe" integer, "assignedgc" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "companycreatorId" integer, CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "company_user_market_enum" AS ENUM('0', '1', '2', '3', '4', '5')`);
        await queryRunner.query(`CREATE TYPE "company_user_croles_enum" AS ENUM('0', '1', '2', '3')`);
        await queryRunner.query(`CREATE TABLE "company_user" ("id" SERIAL NOT NULL, "firstname" character varying NOT NULL, "lastname" character varying NOT NULL, "email" character varying NOT NULL, "reportsTo" integer, "mobile" integer, "password" character varying NOT NULL, "market" "company_user_market_enum" NOT NULL, "croles" "company_user_croles_enum" NOT NULL DEFAULT '3', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_815a6e08cfb5285a52644e14951" UNIQUE ("firstname"), CONSTRAINT "UQ_35bc686376c61e7376756a6646e" UNIQUE ("lastname"), CONSTRAINT "UQ_71317b70f843581c2913b1cee4e" UNIQUE ("email"), CONSTRAINT "PK_879141ebc259b4c0544b3f1ea4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "updoot" ADD CONSTRAINT "FK_9df9e319a273ad45ce509cf2f68" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "updoot" ADD CONSTRAINT "FK_fd6b77bfdf9eae6691170bc9cb5" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "FK_8f39aebfe95a905bafb494fd74b" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "FK_86653de4d3f06146a3a9472eaeb" FOREIGN KEY ("companycreatorId") REFERENCES "company_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_86653de4d3f06146a3a9472eaeb"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_8f39aebfe95a905bafb494fd74b"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b"`);
        await queryRunner.query(`ALTER TABLE "updoot" DROP CONSTRAINT "FK_fd6b77bfdf9eae6691170bc9cb5"`);
        await queryRunner.query(`ALTER TABLE "updoot" DROP CONSTRAINT "FK_9df9e319a273ad45ce509cf2f68"`);
        await queryRunner.query(`DROP TABLE "company_user"`);
        await queryRunner.query(`DROP TYPE "company_user_croles_enum"`);
        await queryRunner.query(`DROP TYPE "company_user_market_enum"`);
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TYPE "ticket_market_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "updoot"`);
    }

}
