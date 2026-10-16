import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProfessorService } from './professor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('professors')
export class ProfessorController {
  constructor(private readonly professorsService: ProfessorService) {}

  // Get all professors (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.professorsService.getAll();
  }

  // Get single professor by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.professorsService.findById(+id);
  }

  // Create professor (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { prof_name: string }) {
    return this.professorsService.createProfessor(body.prof_name);
  }

  // Update professor by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { prof_name?: string }) {
    return this.professorsService.updateProfessor(+id, body);
  }

  // Delete professor by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.professorsService.deleteProfessor(+id);
  }
}