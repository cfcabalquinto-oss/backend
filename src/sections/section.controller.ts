import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
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
  async create(
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: {
      subject_name: string;
      section_name: string;
      schedule_text?: string | null;
      room?: string | null;
    },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can create teaching sections.');
    return this.sectionService.createProfessorSection(
      request.user.userId,
      body.subject_name,
      body.section_name,
      body.schedule_text,
      body.room,
    );
  }

  // Update section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() request: { user: { userId: number; role: string } },
    @Body() body: {
      subject_name?: string;
      section_name?: string;
      schedule_text?: string | null;
      room?: string | null;
    },
  ) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can edit teaching sections.');
    return this.sectionService.updateProfessorSection(+id, request.user.userId, body);
  }

  // Delete section by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: { user: { userId: number; role: string } }) {
    if (request.user.role !== 'professor') throw new ForbiddenException('Only professors can remove teaching sections.');
    return this.sectionService.deleteProfessorSection(+id, request.user.userId);
  }
}
