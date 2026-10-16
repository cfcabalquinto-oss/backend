import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class GradeService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createGrade(
    PT_AVE: number,
    Attendance_ave: number,
    exam_ave: number,
    gen_ave: number,
    student_id: number,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO grades (PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id) VALUES (?, ?, ?, ?, ?)',
      [PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id],
    );
    return {
      grade_id: result.insertId,
      PT_AVE,
      Attendance_ave,
      exam_ave,
      gen_ave,
      student_id,
    };
  }

  async findById(grade_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT grade_id, PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id, created_at, updated_at FROM grades WHERE grade_id = ?',
      [grade_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT grade_id, PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id, created_at, updated_at FROM grades',
    );
    return rows;
  }

  async updateGrade(
    grade_id: number,
    partial: {
      PT_AVE?: number;
      Attendance_ave?: number;
      exam_ave?: number;
      gen_ave?: number;
      student_id?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.PT_AVE !== undefined) {
      fields.push('PT_AVE = ?');
      values.push(partial.PT_AVE);
    }
    if (partial.Attendance_ave !== undefined) {
      fields.push('Attendance_ave = ?');
      values.push(partial.Attendance_ave);
    }
    if (partial.exam_ave !== undefined) {
      fields.push('exam_ave = ?');
      values.push(partial.exam_ave);
    }
    if (partial.gen_ave !== undefined) {
      fields.push('gen_ave = ?');
      values.push(partial.gen_ave);
    }
    if (partial.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(partial.student_id);
    }

    if (fields.length === 0) return await this.findById(grade_id);

    values.push(grade_id);
    const sql = `UPDATE grades SET ${fields.join(', ')} WHERE grade_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(grade_id);
  }

  async deleteGrade(grade_id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM grades WHERE grade_id = ?',
      [grade_id],
    );
    return res.affectedRows > 0;
  }
}