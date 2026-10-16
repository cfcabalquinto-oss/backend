import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}