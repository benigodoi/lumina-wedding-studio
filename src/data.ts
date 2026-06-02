/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wedding, GoogleCalendarEvent } from './types';

export const SERVICE_PRICES = {
  'Photography': 1500,
  'Cinematography': 2000,
  'Civil Ceremony': 600,
  'Wedding Album': 400
};

export const INITIAL_WEDDINGS: Wedding[] = [
  {
    id: 'w-1',
    groomName: 'Ion',
    brideName: 'Maria',
    date: '2026-06-15',
    time: '14:00',
    location: 'Palatul Mogoșoaia, Bucharest',
    status: 'Confirmed',
    services: ['Photography', 'Cinematography', 'Wedding Album'],
    advancePaid: 1500,
    remaining: 1500,
    notes: 'Pre-wedding shoot included • Full Day Coverage (14:00 - 02:00)',
    email: 'ion.maria@gmail.ro',
    timeline: [
      { time: '14:00', activity: 'Groom Preparation Photo Shoot' },
      { time: '15:30', activity: 'Bride Makeup & Dress Details' },
      { time: '17:00', activity: 'Outdoor Religious Ceremony in the Gardens' },
      { time: '18:30', activity: 'Cocktail Hour & Couple Portraits' },
      { time: '20:00', activity: 'Grand Entrance & Wedding Celebrations Banquet' },
      { time: '22:00', activity: 'First Dance & Special Moments Captured' },
      { time: '02:00', activity: 'Grand Sparklers Farewell & Wrap-up' }
    ]
  },
  {
    id: 'w-2',
    groomName: 'Andrei',
    brideName: 'Elena',
    date: '2026-06-22',
    time: '15:00',
    location: 'The Wedding House, Giurgiu',
    status: 'Pending Deposit',
    services: ['Photography', 'Civil Ceremony'],
    advancePaid: 500,
    remaining: 2000,
    notes: 'Pre-wedding shoot included',
    email: 'andrei.elena.vasile@gmail.com',
    timeline: [
      { time: '15:00', activity: 'Detailed flatlay setup photography' },
      { time: '16:00', activity: 'First Look & Couple Portrait session' },
      { time: '18:00', activity: 'Civil Marriage Union' },
      { time: '19:30', activity: 'Garden dinner & emotional toasts' }
    ]
  },
  {
    id: 'w-3',
    groomName: 'Mihai',
    brideName: 'Anca',
    date: '2026-07-06',
    time: '16:00',
    location: 'Tree House, Cosoba',
    status: 'Confirmed',
    services: ['Photography', 'Cinematography'],
    advancePaid: 1200,
    remaining: 1800,
    notes: '2nd Photographer booked',
    email: 'mihai.anca.stoica@outlook.com',
    timeline: [
      { time: '16:00', activity: 'Photographers arrive at forest venue' },
      { time: '17:30', activity: 'Bride and Groom portrait sessions' },
      { time: '19:00', activity: 'Ceremony next to beautiful pool area' },
      { time: '20:30', activity: 'Outdoor party under lights' }
    ]
  },
  {
    id: 'w-4',
    groomName: 'Dan',
    brideName: 'Sorina',
    date: '2026-07-13',
    time: '13:00',
    location: 'Villa 23, Snagov',
    status: 'Signed',
    services: ['Photography', 'Wedding Album'],
    advancePaid: 1000,
    remaining: 1500,
    notes: 'Custom Album Package',
    email: 'dan.sorina.marin@snagov.ro',
    timeline: [
      { time: '13:00', activity: 'Arrival and lakefront landscape photo setup' },
      { time: '14:30', activity: 'Getting ready shots by Snagov Lake' },
      { time: '16:30', activity: 'Lakeside religious ceremony' }
    ]
  },
  {
    id: 'w-5',
    groomName: 'Andrei',
    brideName: 'Elena', // In dashboard screenshot: Elena & Andrei
    date: '2026-10-12',
    time: '12:00',
    location: 'Grand Hotel, Bucharest',
    status: 'Confirmed',
    services: ['Photography'],
    advancePaid: 1000,
    remaining: 500,
    notes: 'Elegant Ballroom styling',
    email: 'elena.andrei@grandhotel.ro',
    timeline: [
      { time: '12:00', activity: 'Hotel lobby shoot setup' },
      { time: '13:30', activity: 'Traditional sweet ceremony' }
    ]
  },
  {
    id: 'w-6',
    groomName: 'Dan',
    brideName: 'Maria', // In dashboard screenshot: Maria & Dan
    date: '2026-10-19',
    time: '15:00',
    location: 'The Garden Venue',
    status: 'Final Prep',
    services: ['Photography', 'Cinematography', 'Wedding Album'],
    advancePaid: 2000,
    remaining: 1500,
    notes: 'Drone coverage requested',
    email: 'maria.dan.garden@outlook.com'
  },
  {
    id: 'w-7',
    groomName: 'Mihai',
    brideName: 'Ioana', // In dashboard screenshot: Ioana & Mihai
    date: '2026-10-26',
    time: '16:00',
    location: 'Castle Cantacuzino',
    status: 'Pending Edit',
    services: ['Photography', 'Cinematography'],
    advancePaid: 1500,
    remaining: 1500,
    notes: 'Castle backdrop drone shots booked',
    email: 'ioana.mihai.castle@cantacuzino.ro'
  }
];

export const INITIAL_GOOGLE_EVENTS: GoogleCalendarEvent[] = [
  {
    id: 'g-1',
    title: 'Studio Maintenance & Hardware Setup',
    date: '2026-06-10',
    time: '10:00',
    duration: '3 hours',
    description: 'Calibrating key lights and mapping studio layout.',
    calendarName: 'Primary Studio Feed'
  },
  {
    id: 'g-2',
    title: 'Camera Lens Calibration Session',
    date: '2026-06-18',
    time: '11:00',
    duration: '4.5 hours',
    description: 'Calibrating autofocus system on prime lenses.',
    calendarName: 'Equipment Upkeeps'
  },
  {
    id: 'g-3',
    title: 'Lumina Staff Quarterly Alignment',
    date: '2026-07-15',
    time: '09:00',
    duration: '2 hours',
    description: 'Syncing with the drone operations and second videographer teams.',
    calendarName: 'Internal Feed'
  },
  {
    id: 'g-4',
    title: 'Equipment Maintenance Check',
    date: '2026-10-05',
    time: '14:00',
    duration: '3 hours',
    description: 'Testing and formatting camera memory units and gimbal calibrations.',
    calendarName: 'Equipment Upkeeps'
  },
  {
    id: 'g-5',
    title: 'Private Headshot Rental Blockout',
    date: '2026-10-21',
    time: '09:00',
    duration: 'All Day',
    description: 'External corporate crew renting primary studio room.',
    calendarName: 'Studio Rentals'
  }
];

