import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}