import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Get all students (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.studentService.getAll();
  }

  // Get single student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.studentService.findById(+id);
  }

  // Create student (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { student_name: string, dateofbirth: string, section_id: number, contact_num: string }) {
    return this.studentService.createStudent(body.student_name, body.dateofbirth, body.section_id, body.contact_num);
  }

  // Update student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { student_name?: string, dateofbirth?: string, section_id?: number, contact_num?: string }) {
    return this.studentService.updateStudent(+id, body);
  }

  // Delete student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.studentService.deleteStudent(+id);
  }
}