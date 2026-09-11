export interface TrialStatus {
  total_today: number;
  answered_count: number;
  exhausted: boolean;
}

export interface MeOut {
  user_id: number;
  username: string | null;
  first_name: string | null;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  full_access: boolean;
  full_access_reason: "subscription" | "new_user_trial" | null;
  trial_period_expires_at: string | null;
  trial: TrialStatus;
  trial_exam_available: boolean;
  price_week: string;
  price_month: string;
  is_admin: boolean;
  chat_unread: boolean;
}

export interface QuestionBase {
  id: string;
  image_url: string | null;
  video_url: string | null;
  question_en: string;
  question_ru: string;
  option_a_en: string | null;
  option_b_en: string | null;
  option_c_en: string | null;
  option_d_en: string | null;
  option_e_en: string | null;
  option_a_ru: string | null;
  option_b_ru: string | null;
  option_c_ru: string | null;
  option_d_ru: string | null;
  option_e_ru: string | null;
  is_multi: boolean;
}

// Learn mode: correct answer included, client reveals it on tap.
export interface QuestionPublic extends QuestionBase {
  correct_letters: string[];
  anchors_en: string | null;
  anchors_ru: string | null;
  correct_anchors_en: string | null;
  correct_anchors_ru: string | null;
}

// Exam mode: no correct answer sent to the client — scored server-side on finish.
export type QuestionExam = QuestionBase;

export interface LearnSessionOut {
  locked: boolean;
  lock_reason: string | null;
  questions: QuestionPublic[];
  resume_question_id: string | null;
}

export interface DrillSessionOut {
  locked: boolean;
  lock_reason: string | null;
  questions: QuestionPublic[];
}

export interface ExamStartOut {
  locked: boolean;
  lock_reason: string | null;
  exam_attempt_id: number | null;
  questions: QuestionExam[];
  started_at: string | null;
  duration_seconds: number | null;
}

export interface ExamAnswerIn {
  question_id: string;
  selected_letters: string[];
}

export interface ExamFinishIn {
  exam_attempt_id: number;
  answers: ExamAnswerIn[];
}

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  text: string;
  image_url: string | null;
  created_at: string;
  edited_at: string | null;
  is_admin: boolean;
  is_pinned: boolean;
}

export interface ExamQuestionResult {
  question_id: string;
  is_correct: boolean;
  correct_letters: string[];
  selected_letters: string[];
}

export interface ExamFinishOut {
  score_points: number;
  correct_count: number;
  total_count: number;
  passed: boolean;
  results: ExamQuestionResult[];
}

export interface ChatUploadOut {
  image_url: string;
}

export interface LicenseRedeemOut {
  ok: boolean;
  error: string | null;
  plan: string | null;
  expires_at: string | null;
}

export interface ExamHistoryItem {
  id: number;
  finished_at: string | null;
  score_points: number | null;
  correct_count: number | null;
  total_count: number;
  passed: boolean | null;
}

export interface DrillWeeklyAccuracy {
  week_start: string;
  accuracy_pct: number | null;
  total: number;
}

export interface ProfileOut {
  daily_goal: number | null;
  today_progress: number;
  drill_accuracy_pct: number | null;
  drill_weekly_accuracy: DrillWeeklyAccuracy[];
  exam_history: ExamHistoryItem[];
  streak_days: number;
  checked_in_today: boolean;
  bonus_trial_attempts: number;
}

export interface CheckinOut {
  streak_days: number;
  checked_in_today: boolean;
  bonus_exam_granted: boolean;
}

export interface AdminStatsOut {
  total_users: number;
  paying_users: number;
  total_visits: number;
}

export interface AdminDailyStat {
  date: string;
  visits: number;
  new_users: number;
}

export interface AdminDailyStatsOut {
  today_visits: number;
  yesterday_visits: number;
  days: AdminDailyStat[];
}

export interface AdminUserOut {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_seen_at: string | null;
  visit_count: number;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  last_section: string | null;
  last_section_at: string | null;
}

export interface SectionVisitOut {
  section: string;
  visited_at: string;
}

export interface AdminExamStatsOut {
  started: number;
  finished: number;
  passed: number;
  abandoned: number;
  avg_score: number | null;
}
