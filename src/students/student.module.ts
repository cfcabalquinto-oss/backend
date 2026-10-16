import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}