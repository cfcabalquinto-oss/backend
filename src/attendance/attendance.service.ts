import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
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
    status: string,
    professorUserId: number,
  ) {
    if (!['Present', 'Absent', 'Late'].includes(status)) throw new BadRequestException('Attendance status must be Present, Absent, or Late.');
    const [result] = await this.pool().execute<OkPacket>(
      `INSERT INTO attendance (attendance_month, attendance_day, student_id, section_id, status)
       SELECT ?, ?, ?, s.section_id, ?
       FROM sections s JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE s.section_id = ? AND p.user_id = ?
         AND EXISTS (SELECT 1 FROM enrollments e
                     WHERE e.student_id = ? AND e.section_id = s.section_id AND e.status = 'Enrolled')`,
      [attendance_month, attendance_day, student_id, status, section_id, professorUserId, student_id],
    );
    if (!result.affectedRows) throw new ForbiddenException('You can only add attendance for your assigned sections.');
    return {
      attendance_id: result.insertId,
      attendance_month,
      attendance_day,
      student_id,
      section_id,
      status,
    };
  }

  async findById(attendance_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT attendance_id, attendance_month, attendance_day, student_id, section_id, status, created_at, updated_at FROM attendance WHERE attendance_id = ?',
      [attendance_id],
    );
    return rows[0];
  }

  async findByIdForProfessor(attendance_id: number, professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT a.attendance_id, a.attendance_month, a.attendance_day,
              a.student_id, a.section_id, a.status, a.created_at, a.updated_at
       FROM attendance a
       JOIN sections s ON s.section_id = a.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE a.attendance_id = ? AND p.user_id = ? LIMIT 1`,
      [attendance_id, professorUserId],
    );
    return rows[0];
  }

  async getAll(professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT a.attendance_id, a.attendance_month, a.attendance_day,
              a.student_id, a.section_id, a.status, a.created_at, a.updated_at
       FROM attendance a
       JOIN sections s ON s.section_id = a.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE p.user_id = ?`,
      [professorUserId],
    );
    return rows;
  }

  async updateAttendance(
    attendance_id: number,
    partial: {
      attendance_month?: string;
      attendance_day?: number;
      status?: string;
    },
    professorUserId: number,
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
    if (partial.status !== undefined) {
      if (!['Present', 'Absent', 'Late'].includes(partial.status)) throw new BadRequestException('Attendance status must be Present, Absent, or Late.');
      fields.push('status = ?');
      values.push(partial.status);
    }

    if (fields.length === 0) return await this.findById(attendance_id);

    values.push(attendance_id, professorUserId);
    const sql = `UPDATE attendance a SET ${fields.join(', ')}
      WHERE a.attendance_id = ? AND EXISTS (
        SELECT 1 FROM sections s JOIN professors p ON p.teacher_id = s.teacher_id
        WHERE s.section_id = a.section_id AND p.user_id = ?
          AND EXISTS (SELECT 1 FROM enrollments e
                      WHERE e.student_id = a.student_id AND e.section_id = a.section_id AND e.status = 'Enrolled')
      )`;
    const [result] = await this.pool().execute<OkPacket>(sql, values);
    if (!result.affectedRows) {
      const [owned] = await this.pool().execute<RowDataPacket[]>(
        `SELECT a.attendance_id FROM attendance a
         JOIN sections s ON s.section_id = a.section_id
         JOIN professors p ON p.teacher_id = s.teacher_id
         JOIN enrollments e ON e.student_id = a.student_id AND e.section_id = a.section_id AND e.status = 'Enrolled'
         WHERE a.attendance_id = ? AND p.user_id = ? LIMIT 1`,
        [attendance_id, professorUserId],
      );
      if (!owned.length) throw new ForbiddenException('You can only edit attendance for active students in your assigned sections.');
    }
    return this.findById(attendance_id);
  }

  async deleteAttendance(attendance_id: number, professorUserId: number) {
    const [res] = await this.pool().execute<OkPacket>(
      `DELETE a FROM attendance a
       JOIN sections s ON s.section_id = a.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE a.attendance_id = ? AND p.user_id = ?`,
      [attendance_id, professorUserId],
    );
    return res.affectedRows > 0;
  }
}
