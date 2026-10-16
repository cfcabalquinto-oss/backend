import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FeeService } from './fee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fees')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // Get all fees (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.feeService.getAll();
  }
  // Get single fee by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.feeService.findById(+id);
  }

  // Create fee (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
 async create(@Body() body: { amount: number; trans_history: string; student_id: number }) {
    return this.feeService.createFee(body.amount, body.trans_history, body.student_id);
  }

  // Update fee by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { amount?: number; trans_history?: string; student_id?: number }) {
    return this.feeService.updateFee(+id, body);
  }

  // Delete fee by ID (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.feeService.deleteFee(+id);
  }
}
