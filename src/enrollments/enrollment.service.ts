import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class EnrollmentService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createEnrollment(enrollment_date: string, student_id: number, section_id: number) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO enrollments (enrollment_date, student_id, section_id) VALUES (?, ?, ?)',
      [enrollment_date, student_id, section_id],
    );
    return { enrollment_id: result.insertId, enrollment_date, student_id, section_id };
  }

  async findById(enrollment_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT enrollment_id, enrollment_date, student_id, section_id, created_at, updated_at FROM enrollments WHERE enrollment_id = ?',
      [enrollment_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT enrollment_id, enrollment_date, student_id, section_id, created_at, updated_at FROM enrollments',
    );
    return rows;
  }

  async updateEnrollment(
    enrollment_id: number,
    partial: { enrollment_date?: string; student_id?: number; section_id?: number },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.enrollment_date !== undefined) {
      fields.push('enrollment_date = ?');
      values.push(partial.enrollment_date);
    }
    if (partial.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(partial.student_id);
    }
    if (partial.section_id !== undefined) {
      fields.push('section_id = ?');
      values.push(partial.section_id);
    }

    if (fields.length === 0) return await this.findById(enrollment_id);

    values.push(enrollment_id);
    const sql = `UPDATE enrollments SET ${fields.join(', ')} WHERE enrollment_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(enrollment_id);
  }

  async deleteEnrollment(enrollment_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM enrollments WHERE enrollment_id = ?', [enrollment_id]);
    return res.affectedRows > 0;
  }
}