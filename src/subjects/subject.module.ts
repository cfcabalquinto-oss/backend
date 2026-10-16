import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}