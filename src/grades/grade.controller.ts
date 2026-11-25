import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  // Get all grades (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Grade lists are only available to professors.');
    return this.gradeService.getAll(request.user.userId);
  }

  // Get single grade by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Grade records are only available to professors.');
    return this.gradeService.findByIdForProfessor(+id, request.user.userId);
  }

  // Create grade (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { PT_AVE: number; Attendance_ave: number; exam_ave: number; gen_ave: number; student_id: number; section_id: number },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can add grades.');
    return this.gradeService.createGrade(body.PT_AVE, body.Attendance_ave, body.exam_ave, body.gen_ave, Number(body.student_id), Number(body.section_id), request.user.userId);
  }

  // Update section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: { PT_AVE?: number; Attendance_ave?: number; exam_ave?: number; gen_ave?: number },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can edit grades.');
    return this.gradeService.updateGrade(+id, body, request.user.userId);
  }

  // Delete section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can remove grade records.');
    return this.gradeService.deleteGrade(+id, request.user.userId);
  }
}
