import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FeeService } from './fee.service';
import { FeeController } from './fee.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}