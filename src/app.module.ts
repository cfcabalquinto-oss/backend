import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ProfessorModule } from './professors/professor.module';
import { SubjectModule } from './subjects/subject.module';
import { SectionModule } from './sections/section.module';
import { StudentModule } from './students/student.module';
import { AttendanceModule } from './attendance/attendance.module';
import { EnrollmentModule } from './enrollments/enrollment.module';
import { GradeModule } from './grades/grade.module';
import { FeeModule } from './fees/fee.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, ProfessorModule, SubjectModule, SectionModule, StudentModule, AttendanceModule, EnrollmentModule, GradeModule, FeeModule],
})
export class AppModule {}