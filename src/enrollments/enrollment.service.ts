import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class EnrollmentService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createEnrollment(enrollment_date: string, student_id: number, section_id: number, professorUserId: number) {
    const [result] = await this.pool().execute<OkPacket>(
      `INSERT INTO enrollments (enrollment_date, student_id, section_id, status)
       SELECT ?, ?, sec.section_id, 'Enrolled'
       FROM sections sec JOIN professors p ON p.teacher_id = sec.teacher_id
       WHERE sec.section_id = ? AND p.id = ?
         AND NOT EXISTS (
           SELECT 1 FROM enrollments existing
           WHERE existing.student_id = ? AND existing.section_id = ? AND existing.status <> 'Dropped'
         )`,
      [enrollment_date, student_id, section_id, professorUserId, student_id, section_id],
    );
    if (!result.affectedRows) throw new BadRequestException('Student is already enrolled or this section is not assigned to your account.');
    return { enrollment_id: result.insertId, enrollment_date, student_id, section_id, status: 'Enrolled' };
  }

  async findById(enrollment_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT enrollment_id, enrollment_date, student_id, section_id, status, drop_reason, status_updated_at, created_at, updated_at FROM enrollments WHERE enrollment_id = ?',
      [enrollment_id],
    );
    return rows[0];
  }

  async findByIdForProfessor(enrollment_id: number, professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT e.enrollment_id, e.enrollment_date, e.student_id, e.section_id,
              e.status, e.drop_reason, e.status_updated_at, e.created_at, e.updated_at
       FROM enrollments e
       JOIN sections sec ON sec.section_id = e.section_id
       JOIN professors p ON p.teacher_id = sec.teacher_id
       WHERE e.enrollment_id = ? AND p.id = ? LIMIT 1`,
      [enrollment_id, professorUserId],
    );
    return rows[0];
  }

  async getAll(professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT e.enrollment_id, e.enrollment_date, e.student_id, e.section_id,
              e.status, e.drop_reason, e.status_updated_at, e.created_at, e.updated_at
       FROM enrollments e
       JOIN sections sec ON sec.section_id = e.section_id
       JOIN professors p ON p.teacher_id = sec.teacher_id
       WHERE p.id = ?`,
      [professorUserId],
    );
    return rows;
  }

  async updateEnrollment(
    enrollment_id: number,
    partial: { enrollment_date?: string; status?: string; drop_reason?: string },
    professorUserId: number,
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.enrollment_date !== undefined) {
      fields.push('enrollment_date = ?');
      values.push(partial.enrollment_date);
    }
    if (partial.status !== undefined) {
      if (!['Enrolled', 'Dropped'].includes(partial.status)) throw new BadRequestException('Status must be Enrolled or Dropped.');
      fields.push('status = ?');
      values.push(partial.status);
    }
    if (partial.drop_reason !== undefined) {
      fields.push('drop_reason = ?');
      values.push(partial.drop_reason || null);
    }

    if (fields.length === 0) return await this.findById(enrollment_id);

    values.push(enrollment_id, professorUserId);
    const sql = `UPDATE enrollments e SET ${fields.join(', ')}
      WHERE e.enrollment_id = ? AND EXISTS (
        SELECT 1 FROM sections sec JOIN professors p ON p.teacher_id = sec.teacher_id
        WHERE sec.section_id = e.section_id AND p.id = ?
      )`;
    const [result] = await this.pool().execute<OkPacket>(sql, values);
    if (!result.affectedRows) throw new ForbiddenException('You can only update enrollments in your assigned sections.');
    return this.findById(enrollment_id);
  }

  async requestDrop(enrollment_id: number, studentUserId: number, reason: string) {
    const [result] = await this.pool().execute<OkPacket>(
      `UPDATE enrollments e
       JOIN students s ON s.student_id = e.student_id
       SET e.status = 'Drop Requested', e.drop_reason = ?
       WHERE e.enrollment_id = ? AND s.id = ? AND e.status = 'Enrolled'`,
      [reason || null, enrollment_id, studentUserId],
    );
    if (!result.affectedRows) throw new BadRequestException('This enrollment cannot be requested for drop.');
    return this.findById(enrollment_id);
  }

  async deleteEnrollment(enrollment_id: number, professorUserId: number) {
    const [res] = await this.pool().execute<OkPacket>(
      `DELETE e FROM enrollments e
       JOIN sections sec ON sec.section_id = e.section_id
       JOIN professors p ON p.teacher_id = sec.teacher_id
       WHERE e.enrollment_id = ? AND p.id = ?`,
      [enrollment_id, professorUserId],
    );
    return res.affectedRows > 0;
  }
}
