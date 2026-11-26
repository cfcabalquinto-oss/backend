import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Get all students (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() request: { user: { role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Student records are only available to professors.');
    return this.studentService.getAll();
  }

  // Get single student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() request: { user: { role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Student records are only available to professors.');
    return this.studentService.findById(+id);
  }

  // Create student (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { id?: number | null; student_name: string; dateofbirth?: string | null; section_id?: number | null; contact_num?: string | null }, @Req() request: { user: { role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can create student records.');
    return this.studentService.createStudent(body.id ?? null, body.student_name, body.dateofbirth, body.section_id, body.contact_num);
  }

  @UseGuards(JwtAuthGuard)
  @Post('link-account')
  async linkAccount(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { student_id: number; dateofbirth: string },
  ) {
    if (request.user.role !== 'student') throw new ForbiddenException('Only student accounts can link a student profile.');
    return this.studentService.linkAccount(request.user.userId, Number(body.student_id), body.dateofbirth);
  }

  // Update student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { student_name?: string; dateofbirth?: string | null; section_id?: number | null; contact_num?: string | null }, @Req() request: { user: { role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can edit student records.');
    return this.studentService.updateStudent(+id, body);
  }

  // Delete student by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: { user: { role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can remove student records.');
    return this.studentService.deleteStudent(+id);
  }
}
