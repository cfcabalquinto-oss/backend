import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';  

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Get all attendance records (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Attendance lists are only available to professors.');
    return this.attendanceService.getAll(request.user.userId);
  }
  // Get single attendance record by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Attendance records are only available to professors.');
    return this.attendanceService.findByIdForProfessor(+id, request.user.userId);
  }

  // Create attendance (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { attendance_month: string; attendance_day: number; student_id: number; section_id: number; status: string },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can add attendance records.');
    return this.attendanceService.createAttendance(body.attendance_month, Number(body.attendance_day), Number(body.student_id), Number(body.section_id), body.status, request.user.userId);
  }

  // Update attendance by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { attendance_month?: string; attendance_day?: number; status?: string },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can edit attendance records.');
    return this.attendanceService.updateAttendance(+id, body, request.user.userId);
  }

  // Delete attendance by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can remove attendance records.');
    return this.attendanceService.deleteAttendance(+id, request.user.userId);
  }
}
