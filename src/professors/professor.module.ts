import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProfessorService } from './professor.service';
import { ProfessorController } from './professor.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ProfessorController],
  providers: [ProfessorService],
  exports: [ProfessorService],
})
export class ProfessorModule {}