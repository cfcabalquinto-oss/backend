import { Injectable, NotFoundException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async getForUser(userId: number, role: string) {
    if (role === 'professor') return this.getProfessorDashboard(userId);
    return this.getStudentDashboard(userId);
  }

  private async getProfessorDashboard(userId: number) {
    const [professors] = await this.pool().execute<RowDataPacket[]>(
      'SELECT teacher_id, id AS user_id, prof_name FROM professors WHERE id = ? LIMIT 1',
      [userId],
    );
    const professor = professors[0];
    if (!professor) throw new NotFoundException('No professor profile is linked to this account.');

    const [sections] = await this.pool().execute<RowDataPacket[]>(
      `SELECT s.section_id, s.section_name, s.teacher_id, s.subject_id,
              s.schedule_text, s.room, sub.subject_name, p.prof_name
       FROM sections s
       LEFT JOIN subjects sub ON sub.subject_id = s.subject_id
       LEFT JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE s.teacher_id = ? ORDER BY s.section_name`,
      [professor.teacher_id],
    );
    const [students] = await this.pool().execute<RowDataPacket[]>(
      'SELECT student_id, student_name, section_id FROM students ORDER BY student_name',
    );
    const [enrollments] = await this.pool().execute<RowDataPacket[]>(
      `SELECT e.enrollment_id, e.enrollment_date, e.student_id, e.section_id,
              e.status, e.drop_reason, s.student_name
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       JOIN sections sec ON sec.section_id = e.section_id
       WHERE sec.teacher_id = ? ORDER BY sec.section_name, s.student_name`,
      [professor.teacher_id],
    );
    const [grades] = await this.pool().execute<RowDataPacket[]>(
      `SELECT g.grade_id, g.PT_AVE, g.Attendance_ave, g.exam_ave, g.gen_ave,
              g.student_id, g.section_id, s.student_name, sec.section_name
       FROM grades g
       JOIN students s ON s.student_id = g.student_id
       JOIN sections sec ON sec.section_id = g.section_id
       WHERE sec.teacher_id = ? ORDER BY s.student_name`,
      [professor.teacher_id],
    );
    const [attendance] = await this.pool().execute<RowDataPacket[]>(
      `SELECT a.attendance_id, a.attendance_month, a.attendance_day, a.status,
              a.student_id, a.section_id, s.student_name, sec.section_name
       FROM attendance a
       JOIN students s ON s.student_id = a.student_id
       JOIN sections sec ON sec.section_id = a.section_id
       WHERE sec.teacher_id = ? ORDER BY a.attendance_month DESC, a.attendance_day DESC`,
      [professor.teacher_id],
    );

    return {
      role: 'professor',
      profile: { id: professor.teacher_id, userId: professor.user_id, name: professor.prof_name },
      sections,
      students,
      enrollments,
      grades,
      attendance,
    };
  }

  private async getStudentDashboard(userId: number) {
    const [students] = await this.pool().execute<RowDataPacket[]>(
      'SELECT student_id, id, id AS user_id, student_name, section_id FROM students WHERE id = ? LIMIT 1',
      [userId],
    );
    const student = students[0];
    if (!student) {
      return { role: 'student', profile: null, sections: [], students: [], enrollments: [], grades: [], attendance: [] };
    }

    const [enrollments] = await this.pool().execute<RowDataPacket[]>(
      `SELECT e.enrollment_id, e.enrollment_date, e.student_id, e.section_id,
              e.status, e.drop_reason, s.student_name
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       WHERE e.student_id = ? ORDER BY e.enrollment_date DESC`,
      [student.student_id],
    );
    const [sections] = await this.pool().execute<RowDataPacket[]>(
      `SELECT sec.section_id, sec.section_name, sec.teacher_id, sec.subject_id,
              sec.schedule_text, sec.room, sub.subject_name, p.prof_name,
              e.status AS enrollment_status, e.enrollment_id
       FROM enrollments e
       JOIN sections sec ON sec.section_id = e.section_id
       LEFT JOIN subjects sub ON sub.subject_id = sec.subject_id
       LEFT JOIN professors p ON p.teacher_id = sec.teacher_id
       WHERE e.student_id = ?
         AND e.enrollment_id = (
           SELECT MAX(latest.enrollment_id) FROM enrollments latest
           WHERE latest.student_id = e.student_id AND latest.section_id = e.section_id
         )
       ORDER BY sec.section_name`,
      [student.student_id],
    );
    const [classmates] = await this.pool().execute<RowDataPacket[]>(
      `SELECT DISTINCT peer.student_id, peer.student_name, e.section_id
       FROM enrollments mine
       JOIN enrollments e ON e.section_id = mine.section_id AND e.status = 'Enrolled'
       JOIN students peer ON peer.student_id = e.student_id
       WHERE mine.student_id = ? AND mine.status IN ('Enrolled', 'Drop Requested')
       ORDER BY e.section_id, peer.student_name`,
      [student.student_id],
    );
    const [grades] = await this.pool().execute<RowDataPacket[]>(
      `SELECT g.grade_id, g.PT_AVE, g.Attendance_ave, g.exam_ave, g.gen_ave,
              g.student_id, g.section_id, sec.section_name, sub.subject_name
       FROM grades g
       LEFT JOIN sections sec ON sec.section_id = g.section_id
       LEFT JOIN subjects sub ON sub.subject_id = sec.subject_id
       WHERE g.student_id = ? ORDER BY g.grade_id DESC`,
      [student.student_id],
    );
    const [attendance] = await this.pool().execute<RowDataPacket[]>(
      `SELECT a.attendance_id, a.attendance_month, a.attendance_day, a.status,
              a.student_id, a.section_id, sec.section_name, sub.subject_name
       FROM attendance a
       LEFT JOIN sections sec ON sec.section_id = a.section_id
       LEFT JOIN subjects sub ON sub.subject_id = sec.subject_id
       WHERE a.student_id = ? ORDER BY a.attendance_month DESC, a.attendance_day DESC`,
      [student.student_id],
    );

    return {
      role: 'student',
      profile: { id: student.student_id, userId: student.user_id, name: student.student_name },
      sections,
      students: classmates,
      enrollments,
      grades,
      attendance,
    };
  }
}
