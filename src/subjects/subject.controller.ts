import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // Get all subjects (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.subjectService.getAll();
  }

  // Get single subject by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.subjectService.findById(+id);
  }

  // Create subject (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { subject_name: string }) {
    return this.subjectService.createSubject(body.subject_name);
  }

  // Update subject by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { subject_name?: string }) {
    return this.subjectService.updateSubject(+id, body);
  }

  // Delete subject by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.subjectService.deleteSubject(+id);
  }
}