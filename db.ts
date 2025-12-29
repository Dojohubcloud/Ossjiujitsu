
import { Student, Attendance, Payment, BeltRank, AppSettings, Product, Announcement, StaffMember } from './types';

const STORAGE_KEY = 'oss_bjj_data';

interface AppData {
  students: Student[];
  staff: StaffMember[];
  attendance: Attendance[];
  payments: Payment[];
  products: Product[];
  announcements: Announcement[];
  settings: AppSettings;
}

const DEFAULT_DATA: AppData = {
  students: [],
  staff: [],
  attendance: [],
  payments: [],
  products: [],
  announcements: [],
  settings: {
    accessPassword: 'ben150718',
    academyName: 'TEAM OSS ACADEMY'
  }
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
  const parsed = JSON.parse(stored);
  return parsed;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
