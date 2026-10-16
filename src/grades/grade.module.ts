import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService],
})
export class GradeModule {}
