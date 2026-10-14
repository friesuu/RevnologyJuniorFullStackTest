import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity('users')
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true }) // Databse refuses two accounts with the same email (unique: true)
  email: string;

  @Column({ name: 'password_hash' }) // No @Field here because it exists in the database but not in the API
  passwordHash: string;
}
