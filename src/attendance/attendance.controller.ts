import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';  

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Get all attendance records (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.attendanceService.getAll();
  }
  // Get single attendance record by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.attendanceService.findById(+id);
  }

  // Create attendance (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() body: { attendance_month: string; attendance_day: number; student_id: number; section_id: number }) {
    return this.attendanceService.createAttendance(body.attendance_month, body.attendance_day, body.student_id, body.section_id);
  }

  // Update attendance by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { attendance_month?: string; attendance_day?: number; student_id?: number; section_id?: number }) {
    return this.attendanceService.updateAttendance(+id, body);
  }

  // Delete attendance by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(+id);
  }
}