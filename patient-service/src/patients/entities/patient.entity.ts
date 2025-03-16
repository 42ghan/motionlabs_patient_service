import { DateToMilliTransformer } from './../../entities/transformers/date-to-date-time.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 16,
    update: false,
  })
  name!: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 32,
    update: false,
  })
  phoneNumber!: string;

  @Column({
    name: 'chart_number',
    type: 'varchar',
    length: 32,
    default: '',
  })
  chartNumber?: string;

  @Column({
    name: 'resident_registration_number',
    type: 'char',
    length: 14,
  })
  residentRegistrationNumber!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  memo?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    update: false,
    transformer: new DateToMilliTransformer(),
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    transformer: new DateToMilliTransformer(),
  })
  updatedAt!: Date;
}
