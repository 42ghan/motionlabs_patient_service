import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 16,
    update: false,
  })
  name: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 32,
    update: false,
  })
  phoneNumber: string;

  @Column({
    name: 'chart_number',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  chartNumber: string;

  @Column({
    name: 'resident_registration_number',
    type: 'char',
    length: 15,
  })
  residentRegistrationNumber: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  memo: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    update: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
}
