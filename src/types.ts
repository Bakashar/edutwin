export type AgentType = 'Diagnostic' | 'CognitiveModel' | 'Tutor' | 'Assessment' | 'Prediction' | 'Analytics';

export interface Subject {
  id: string;
  label: string;
  icon: string;
  color: string;
  required: boolean;
}

export interface SubjectStats {
  accuracy: number;
  completed: number;
  weakTopics: string[];
  strongTopics: string[];
}

export interface StudentProfile {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  selectedSubjects: string[];
  weakTopics: string[];
  strongTopics: string[];
  completedTasks: number;
  accuracy: number;
  predictedENT: number;
  subjectStats: Record<string, SubjectStats>;
  learningHistory: {
    topic: string;
    subject: string;
    score: number;
    timestamp: number;
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentType;
  timestamp: number;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
