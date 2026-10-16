import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  // Get all grades (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.gradeService.getAll();
  }

  // Get single grade by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.gradeService.findById(+id);
  }

  // Create grade (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() body: { PT_AVE: number; Attendance_ave: number; exam_ave: number; gen_ave: number; student_id: number }) {
    return this.gradeService.createGrade(body.PT_AVE, body.Attendance_ave, body.exam_ave, body.gen_ave, body.student_id);
  }

  // Update section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { PT_AVE?: number; Attendance_ave?: number; exam_ave?: number; gen_ave?: number; student_id?: number }) {
    return this.gradeService.updateGrade(+id, body);
  }

  // Delete section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.gradeService.deleteGrade(+id);
  }
}
