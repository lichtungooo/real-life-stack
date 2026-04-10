// Demo data for the Dashboard Click-Dummy
// All data is mock - matches the conceptual model from Vision/real-life-stack

export const PLAYER = {
  name: 'Timo',
  location: 'Berlin, Prenzlauer Berg',
  level: 7,
  levelLabel: 'Entdecker',
  currentXP: 1240,
  xpForCurrentLevel: 1000,
  xpForNextLevel: 2100,
  trustLevel: 3,
  maxTrustLevel: 5,
  streak: 7,
  walletBalance: 5133,
  walletCurrency: 'Token',
}

export const SPACES = [
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '🌍',
    color: 'oklch(0.65 0.18 145)',
    children: [
      { id: 'adventure-de', name: 'Adventure Deutschland' },
      { id: 'adventure-ph', name: 'Adventure Philippinen' },
      { id: 'adventure-th', name: 'Adventure Thailand' },
    ],
  },
  {
    id: 'gudensberg',
    name: 'Gudensberg Gemeinschaft',
    icon: '🏡',
    color: 'oklch(0.63 0.16 55)',
    children: [],
  },
  {
    id: 'wir-sind-wertvoll',
    name: 'Wir sind wertvoll',
    icon: '✨',
    color: 'oklch(0.55 0.21 264)',
    children: [],
  },
]

export const SKILL_BRANCHES = [
  { id: 'natur',        label: 'Naturverbundenheit',   icon: '🌱', color: '#48bb78', level: 3, max: 5 },
  { id: 'handwerk',     label: 'Handwerk & Können',    icon: '🔨', color: '#ed8936', level: 2, max: 5 },
  { id: 'wissen',       label: 'Wissen & Verstehen',   icon: '📚', color: '#4f7ef0', level: 4, max: 5 },
  { id: 'gemeinschaft', label: 'Gemeinschaft',         icon: '🤝', color: '#9f7aea', level: 4, max: 5 },
  { id: 'kreativ',      label: 'Kreativität',          icon: '🎨', color: '#f687b3', level: 2, max: 5 },
  { id: 'achtsamkeit',  label: 'Achtsamkeit & Selbst', icon: '🧘', color: '#38b2ac', level: 1, max: 5 },
]

export const PULSE_ITEMS = [
  { id: 'p1', icon: 'Calendar',   text: 'Wildkräuterwanderung in 2h',           space: 'Gudensberg',  type: 'event',   accent: 'secondary' },
  { id: 'p2', icon: 'Swords',     text: '2 neue Quests in deiner Nähe',         space: 'Adventure DE', type: 'quest',   accent: 'warning'   },
  { id: 'p3', icon: 'ShoppingBag',text: 'Lena bietet Fahrrad-Reparatur an',     space: 'Gudensberg',  type: 'offer',   accent: 'pink'      },
  { id: 'p4', icon: 'Wallet',     text: 'Anton hat dir 50 Token geschickt',     space: 'Direkt',      type: 'wallet',  accent: 'primary'   },
  { id: 'p5', icon: 'Users',      text: '5 neue Mitglieder im Adventure-Space', space: 'Adventure',   type: 'member',  accent: 'secondary' },
]

export const CALENDAR_EVENTS = [
  { id: 'e1', title: 'Wildkräuterwanderung', time: '14:00', duration: '2h', space: 'Gudensberg',   color: 'oklch(0.55 0.21 264)', day: 'today' },
  { id: 'e2', title: 'Repair Café',           time: '18:00', duration: '3h', space: 'Adventure DE', color: 'oklch(0.65 0.18 145)', day: 'today' },
  { id: 'e3', title: 'Gemeinschaftsgarten',   time: '10:00', duration: '4h', space: 'Gudensberg',   color: 'oklch(0.63 0.16 55)',  day: 'tomorrow' },
  { id: 'e4', title: 'Nachbarschaftscafé',    time: '15:00', duration: '2h', space: 'Adventure DE', color: 'oklch(0.65 0.20 0)',   day: 'tomorrow' },
  { id: 'e5', title: 'Yoga im Park',          time: '08:00', duration: '1h', space: 'Wir sind wertvoll', color: 'oklch(0.55 0.21 264)', day: 'tomorrow' },
]

export const SUBSCRIBED_CALENDARS = [
  { id: 'gudensberg',     name: 'Gudensberg',          color: 'oklch(0.63 0.16 55)', active: true },
  { id: 'adventure-de',   name: 'Adventure DE',        color: 'oklch(0.65 0.18 145)', active: true },
  { id: 'adventure-ph',   name: 'Adventure PH',        color: 'oklch(0.55 0.21 264)', active: false },
  { id: 'wsw',            name: 'Wir sind wertvoll',   color: 'oklch(0.65 0.20 0)',   active: true },
]

export const QUESTS = [
  { id: 'q1', title: 'Gemeinschaftsgarten anlegen', xp: 120, distance: '2km', progress: null,  category: 'natur'        },
  { id: 'q2', title: 'Repair Café besuchen',         xp: 80,  distance: '3km', progress: null,  category: 'handwerk'     },
  { id: 'q3', title: 'Nachbarschaftscafé',           xp: 200, distance: null,  progress: 60,    category: 'gemeinschaft' },
  { id: 'q4', title: '30 Tage Meditation',           xp: 500, distance: null,  progress: 80,    category: 'achtsamkeit'  },
]

export const LOG_ENTRIES = [
  { id: 'l1', type: 'quest', label: 'Quest',      text: 'Quest abgeschlossen: Gemeinschaftsgarten',  time: 'vor 2h',     xp: 120                  },
  { id: 'l2', type: 'offer', label: 'Angebot',    text: 'Angebot eingestellt: Systemdenken-Workshop', time: 'vor 5h',     xp: 30                   },
  { id: 'l3', type: 'markt', label: 'Markt',      text: 'Tausch: Tomaten gegen Holz',                 time: 'gestern',                  tokens: 15 },
  { id: 'l4', type: 'trust', label: 'Vertrauen',  text: 'Anton hat dir vertraut',                     time: 'vor 3T',     xp: 50                   },
  { id: 'l5', type: 'quest', label: 'Quest',      text: 'Quest gestartet: Repair Café',               time: 'vor 4T'                              },
  { id: 'l6', type: 'offer', label: 'Angebot',    text: 'Angebot: Fahrradwerkstatt',                  time: 'vor 5T',     xp: 25                   },
]

export const TRANSACTIONS = [
  { id: 't1', type: 'in',  text: 'Quest: Gemeinschaftsgarten', amount: 120, time: 'vor 2h',  from: 'Quest-System' },
  { id: 't2', type: 'in',  text: 'Tausch: Tomaten gegen Holz', amount: 15,  time: 'gestern', from: 'Carla M.'     },
  { id: 't3', type: 'out', text: 'Kauf: Saatgut-Paket',        amount: 30,  time: 'gestern', from: 'Bio-Markt'    },
  { id: 't4', type: 'in',  text: 'Anton hat dir geschickt',    amount: 50,  time: 'vor 2T',  from: 'Anton T.'     },
  { id: 't5', type: 'in',  text: 'Marktplatz: Kräuterpaket',   amount: 8,   time: 'vor 1W',  from: 'Lena K.'      },
  { id: 't6', type: 'out', text: 'Leih: Werkzeugbox',          amount: 5,   time: 'vor 1W',  from: 'Repair Café'  },
]

export const MARKETPLACE_ITEMS = [
  { id: 'm1', title: 'Fahrrad-Reparatur',  person: 'Lena K.',    distance: '2km', type: 'offer',    category: 'handwerk' },
  { id: 'm2', title: 'Bio-Tomaten',         person: 'Carla M.',   distance: '5km', type: 'offer',    category: 'natur'    },
  { id: 'm3', title: 'Yoga-Kurs',           person: 'Sarah W.',   distance: '1km', type: 'offer',    category: 'achtsamkeit' },
  { id: 'm4', title: 'Grafikdesign',        person: 'Du',         distance: null,  type: 'need',     category: 'kreativ'  },
  { id: 'm5', title: 'Permakultur-Beratung', person: 'Du',        distance: null,  type: 'need',     category: 'natur'    },
]

export const FEED_ITEMS = [
  { id: 'f1', space: 'Adventure DE',  author: 'Anton T.',   avatar: 'A', text: 'Neues Repair Café in Kassel eröffnet! Kommt vorbei am Samstag ab 14 Uhr. Wir reparieren gemeinsam alles was kaputt ist.', time: 'vor 2h', type: 'announcement' },
  { id: 'f2', space: 'Gudensberg',    author: 'Carla M.',   avatar: 'C', text: 'Markttag am Samstag! Stände noch verfügbar - meldet euch bis Donnerstag bei mir.', time: 'vor 5h', type: 'event' },
  { id: 'f3', space: 'Adventure DE',  author: 'Anton T.',   avatar: 'A', text: 'Quest erstellt: Waldputz-Aktion - 200 XP für alle Teilnehmenden', time: 'vor 1T', type: 'quest' },
  { id: 'f4', space: 'Wir sind wertvoll', author: 'Sarah W.', avatar: 'S', text: 'Neue Yoga-Gruppe startet nächste Woche im Park. Anfänger willkommen!', time: 'vor 2T', type: 'announcement' },
]

export const NOTIFICATIONS = [
  { id: 'n1', text: 'Anton hat dich verifiziert',     time: 'vor 5min', read: false, type: 'trust' },
  { id: 'n2', text: 'Neue Nachricht von Carla',       time: 'vor 1h',   read: false, type: 'message' },
  { id: 'n3', text: 'Quest-Belohnung: +120 XP',       time: 'vor 2h',   read: false, type: 'reward' },
  { id: 'n4', text: 'Sebastian möchte sich verbinden', time: 'vor 1T',   read: true,  type: 'connection' },
]

export const VIEWS = [
  { id: 'mein-tag',    label: 'Mein Tag',   widgets: ['pulse', 'calendar', 'quest', 'wallet', 'log'] },
  { id: 'gaming',      label: 'Gaming',     widgets: ['avatar', 'skill-tree', 'quest', 'log'] },
  { id: 'marktplatz',  label: 'Marktplatz', widgets: ['marketplace', 'wallet', 'pulse', 'log'] },
  { id: 'community',   label: 'Community',  widgets: ['feed', 'pulse', 'spaces', 'calendar'] },
]
