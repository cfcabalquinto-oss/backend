import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SectionService } from './section.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  // Get all sections (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.sectionService.getAll();
  }

  // Get single section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.sectionService.findById(+id);
  }

  // Create section (protected)
  @UseGuards(JwtAuthGuard)
@Post()
  async create(@Body() body: { section_name: string; teacher_id: number }) {
    return this.sectionService.createSection(body.section_name, body.teacher_id);
  }

  // Update section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { section_name?: string; sched?: string; teacher_id?: number; contact_num?: string }) {
    return this.sectionService.updateSection(+id, body);
  }

  // Delete section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sectionService.deleteSection(+id);
  }
}