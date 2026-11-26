import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // Get all enrollments (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Enrollment lists are only available to professors.');
    return this.enrollmentService.getAll(request.user.userId);
  }

  // Get single enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Enrollment records are only available to professors.');
    return this.enrollmentService.findByIdForProfessor(+id, request.user.userId);
  }

  // Create enrollment (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { enrollment_date: string; student_id: number; section_id: number },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can enroll students.');
    return this.enrollmentService.createEnrollment(body.enrollment_date, Number(body.student_id), Number(body.section_id), request.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('with-student')
  async createStudentAndEnroll(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: {
      section_id: number;
      enrollment_date: string;
      student_name: string;
      dateofbirth?: string | null;
      contact_num?: string | null;
      user_account_id?: number | null;
    },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can add students to sections.');
    return this.enrollmentService.createStudentAndEnroll(
      request.user.userId,
      Number(body.section_id),
      body.enrollment_date,
      {
        student_name: body.student_name,
        dateofbirth: body.dateofbirth,
        contact_num: body.contact_num,
        user_account_id: body.user_account_id,
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/drop-request')
  async requestDrop(
    @Param('id') id: string,
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { reason?: string },
  ) {
    if (request.user.role !== 'student') throw new ForbiddenException('Only students can request a drop.');
    return this.enrollmentService.requestDrop(+id, request.user.userId, body.reason?.trim() ?? '');
  }

  // Update enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { enrollment_date?: string; status?: string; drop_reason?: string },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can update enrollments.');
    return this.enrollmentService.updateEnrollment(+id, body, request.user.userId);
  }

  // Delete enrollment by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can remove enrollments.');
    return this.enrollmentService.deleteEnrollment(+id, request.user.userId);
  }
}
