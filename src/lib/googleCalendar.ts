/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleCalendarEvent } from '../types';

const EVENTS_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** Thrown when Google rejects the token (expired, or consented with the old read-only scope). */
export class GoogleAuthError extends Error {}

/** Events created before write support existed (or while offline) live only in our DB. */
export function isLocalOnlyEvent(id: string): boolean {
  return id.startsWith('g-custom-');
}

function assertAuthorized(res: Response) {
  if (res.status === 401 || res.status === 403) {
    throw new GoogleAuthError(`Google rejected the token (${res.status})`);
  }
}

export async function listGoogleCalendarEvents(token: string): Promise<GoogleCalendarEvent[]> {
  const now = new Date().toISOString();
  const url = `${EVENTS_API}?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    id: item.id,
    title: item.summary ?? '(No title)',
    date: (item.start?.date ?? item.start?.dateTime ?? '').slice(0, 10),
    time: item.start?.dateTime
      ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'All Day',
    duration: item.end?.dateTime && item.start?.dateTime
      ? `${Math.round((new Date(item.end.dateTime).getTime() - new Date(item.start.dateTime).getTime()) / 60000)} min`
      : 'All Day',
    description: item.description ?? '',
    calendarName: 'Primary',
  }));
}

export interface GoogleEventInput {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationHours?: number; // default 2
  description?: string;
  location?: string;
}

function buildEventBody(input: GoogleEventInput) {
  const start = new Date(`${input.date}T${input.time || '10:00'}:00`);
  const end = new Date(start.getTime() + (input.durationHours ?? 2) * 60 * 60 * 1000);
  return {
    summary: input.title,
    description: input.description ?? '',
    location: input.location ?? '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

/** Creates the event on the user's primary Google Calendar and returns Google's event id. */
export async function createGoogleCalendarEvent(token: string, input: GoogleEventInput): Promise<string> {
  const res = await fetch(EVENTS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(input)),
  });
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Google event create failed: ${res.status}`);

  const created = await res.json();
  return created.id as string;
}

export async function updateGoogleCalendarEvent(token: string, eventId: string, input: GoogleEventInput): Promise<void> {
  const res = await fetch(`${EVENTS_API}/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEventBody(input)),
  });
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Google event update failed: ${res.status}`);
}

export async function deleteGoogleCalendarEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`${EVENTS_API}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  // Already gone on Google's side — treat as deleted
  if (res.status === 404 || res.status === 410) return;
  assertAuthorized(res);
  if (!res.ok) throw new Error(`Google event delete failed: ${res.status}`);
}
