import { ForbiddenException, Injectable } from '@nestjs/common';
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
    section_id: number,
    professorUserId: number,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      `INSERT INTO grades (PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id, section_id)
       SELECT ?, ?, ?, ?, ?, s.section_id
       FROM sections s JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE s.section_id = ? AND p.user_id = ?
         AND EXISTS (SELECT 1 FROM enrollments e
                     WHERE e.student_id = ? AND e.section_id = s.section_id AND e.status = 'Enrolled')`,
      [PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id, section_id, professorUserId, student_id],
    );
    if (!result.affectedRows) throw new ForbiddenException('You can only add grades for your assigned sections.');
    return {
      grade_id: result.insertId,
      PT_AVE,
      Attendance_ave,
      exam_ave,
      gen_ave,
      student_id,
      section_id,
    };
  }

  async findById(grade_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT grade_id, PT_AVE, Attendance_ave, exam_ave, gen_ave, student_id, section_id, created_at, updated_at FROM grades WHERE grade_id = ?',
      [grade_id],
    );
    return rows[0];
  }

  async findByIdForProfessor(grade_id: number, professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT g.grade_id, g.PT_AVE, g.Attendance_ave, g.exam_ave, g.gen_ave,
              g.student_id, g.section_id, g.created_at, g.updated_at
       FROM grades g
       JOIN sections s ON s.section_id = g.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE g.grade_id = ? AND p.user_id = ? LIMIT 1`,
      [grade_id, professorUserId],
    );
    return rows[0];
  }

  async getAll(professorUserId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT g.grade_id, g.PT_AVE, g.Attendance_ave, g.exam_ave, g.gen_ave,
              g.student_id, g.section_id, g.created_at, g.updated_at
       FROM grades g
       JOIN sections s ON s.section_id = g.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE p.user_id = ?`,
      [professorUserId],
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
    },
    professorUserId: number,
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
    if (fields.length === 0) return await this.findById(grade_id);

    values.push(grade_id, professorUserId);
    const sql = `UPDATE grades g SET ${fields.join(', ')}
      WHERE g.grade_id = ? AND EXISTS (
        SELECT 1 FROM sections s JOIN professors p ON p.teacher_id = s.teacher_id
        WHERE s.section_id = g.section_id AND p.user_id = ?
          AND EXISTS (SELECT 1 FROM enrollments e
                      WHERE e.student_id = g.student_id AND e.section_id = g.section_id AND e.status = 'Enrolled')
      )`;
    const [result] = await this.pool().execute<OkPacket>(sql, values);
    if (!result.affectedRows) {
      const [owned] = await this.pool().execute<RowDataPacket[]>(
        `SELECT g.grade_id FROM grades g
         JOIN sections s ON s.section_id = g.section_id
         JOIN professors p ON p.teacher_id = s.teacher_id
         JOIN enrollments e ON e.student_id = g.student_id AND e.section_id = g.section_id AND e.status = 'Enrolled'
         WHERE g.grade_id = ? AND p.user_id = ? LIMIT 1`,
        [grade_id, professorUserId],
      );
      if (!owned.length) throw new ForbiddenException('You can only edit grades for active students in your assigned sections.');
    }
    return this.findById(grade_id);
  }

  async deleteGrade(grade_id: number, professorUserId: number) {
    const [res] = await this.pool().execute<OkPacket>(
      `DELETE g FROM grades g
       JOIN sections s ON s.section_id = g.section_id
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE g.grade_id = ? AND p.user_id = ?`,
      [grade_id, professorUserId],
    );
    return res.affectedRows > 0;
  }
}
