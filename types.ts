
export enum BeltRank {
  WHITE = 'Branca',
  GREY_WHITE = 'Cinza/Branca',
  GREY = 'Cinza',
  GREY_BLACK = 'Cinza/Preta',
  YELLOW_WHITE = 'Amarela/Branca',
  YELLOW = 'Amarela',
  YELLOW_BLACK = 'Amarela/Preta',
  ORANGE_WHITE = 'Laranja/Branca',
  ORANGE = 'Laranja',
  ORANGE_BLACK = 'Laranja/Preta',
  GREEN_WHITE = 'Verde/Branca',
  GREEN = 'Verde',
  GREEN_BLACK = 'Verde/Preta',
  BLUE = 'Azul',
  PURPLE = 'Roxa',
  BROWN = 'Marrom',
  BLACK = 'Preta'
}

export interface Student {
  id: string;
  name: string;
  email: string;
  belt: BeltRank;
  stripes: number;
  joinDate: string;
  active: boolean;
  phone: string;
  lastPaymentDate: string;
  professorId?: string; // ID do professor que cadastrou
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Professor' | 'Instrutor' | 'Auxiliar';
  phone: string;
  specialty: string;
  bio: string;
  password: string;
  active: boolean;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  classType: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Geral' | 'Graduação' | 'Evento' | 'Financeiro';
}

export interface AppSettings {
  accessPassword: string;
  academyName: string;
}

export type AppView = 'dashboard' | 'students' | 'attendance' | 'payments' | 'store' | 'mural' | 'staff';
