/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeddingStatus = 'Confirmed' | 'Pending Deposit' | 'Signed' | 'Final Prep' | 'Pending Edit';

export interface TimelineEvent {
  time: string;
  activity: string;
}

export interface Wedding {
  id: string;
  groomName: string;
  brideName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  status: WeddingStatus;
  services: ('Photography' | 'Cinematography' | 'Civil Ceremony' | 'Wedding Album')[];
  advancePaid: number;
  remaining: number;
  notes?: string;
  email?: string;
  timeline?: TimelineEvent[];
  /** Id of the mirrored event on the user's Google Calendar, if pushed. */
  googleEventId?: string | null;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration?: string; // e.g. "2 hours" or "All Day"
  description?: string;
  calendarName?: string; // e.g., "Primary", "Private Commitments"
}

export interface AppStats {
  totalBookings: number;
  upcomingThisMonthCount: number;
  activeMonth: string; // e.g., "June" or "October"
  galleryDeliveriesPending: number;
}
