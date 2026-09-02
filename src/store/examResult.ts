import { reactive } from "vue";

import type { ExamFinishOut, QuestionExam } from "../types";

const state = reactive<{
  result: ExamFinishOut | null;
  questionsById: Record<string, QuestionExam>;
}>({
  result: null,
  questionsById: {},
});

export const examResultStore = {
  state,
  set(result: ExamFinishOut, questions: QuestionExam[]) {
    state.result = result;
    state.questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));
  },
};
