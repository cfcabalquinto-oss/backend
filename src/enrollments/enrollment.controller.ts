import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // Get all enrollments (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.enrollmentService.getAll();
  }

  // Get single enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.enrollmentService.findById(+id);
  }

  // Create enrollment (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() body: { enrollment_date: string; student_id: number; section_id: number }) {
    return this.enrollmentService.createEnrollment(body.enrollment_date, body.student_id, body.section_id);
  }

  // Update enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { enrollment_date?: string; student_id?: number; section_id?: number }) {
    return this.enrollmentService.updateEnrollment(+id, body);
  }

  // Delete enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.enrollmentService.deleteEnrollment(+id);
  }
}