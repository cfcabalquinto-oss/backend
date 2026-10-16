import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class AttendanceService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createAttendance(
    attendance_month: string,
    attendance_day: number,
    student_id: number,
    section_id: number,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO attendance (attendance_month, attendance_day, student_id, section_id) VALUES (?, ?, ?, ?)',
      [attendance_month, attendance_day, student_id, section_id],
    );
    return {
      attendance_id: result.insertId,
      attendance_month,
      attendance_day,
      student_id,
      section_id,
    };
  }

  async findById(attendance_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT attendance_id, attendance_month, attendance_day, student_id, section_id, created_at, updated_at FROM attendance WHERE attendance_id = ?',
      [attendance_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT attendance_id, attendance_month, attendance_day, student_id, section_id, created_at, updated_at FROM attendance',
    );
    return rows;
  }

  async updateAttendance(
    attendance_id: number,
    partial: {
      attendance_month?: string;
      attendance_day?: number;
      student_id?: number;
      section_id?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.attendance_month !== undefined) {
      fields.push('attendance_month = ?');
      values.push(partial.attendance_month);
    }
    if (partial.attendance_day !== undefined) {
      fields.push('attendance_day = ?');
      values.push(partial.attendance_day);
    }
    if (partial.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(partial.student_id);
    }
    if (partial.section_id !== undefined) {
      fields.push('section_id = ?');
      values.push(partial.section_id);
    }

    if (fields.length === 0) return await this.findById(attendance_id);

    values.push(attendance_id);
    const sql = `UPDATE attendance SET ${fields.join(', ')} WHERE attendance_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(attendance_id);
  }

  async deleteAttendance(attendance_id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM attendance WHERE attendance_id = ?',
      [attendance_id],
    );
    return res.affectedRows > 0;
  }
}