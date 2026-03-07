import type { Item, Group, User } from "@real-life-stack/data-interface"

export const demoUsers: User[] = [
  { id: "user-1", displayName: "Max Mustermann", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "user-2", displayName: "Anna Schmidt", avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "user-3", displayName: "Thomas Müller", avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg" },
  { id: "user-4", displayName: "Lisa Weber", avatarUrl: "https://randomuser.me/api/portraits/women/28.jpg" },
]

export const demoGroups: Group[] = [
  {
    id: "group-1",
    name: "Gemeinschaftsgarten",
    data: {
      description: "Gemeinsam gärtnern im Stadtteil",
      access: "invite-member",
      modules: ["kanban", "calendar", "map", "feed"],
      roles: ["admin", "member"],
      memberCount: 12,
    },
  },
  {
    id: "group-2",
    name: "Nachbarschaftshilfe",
    data: {
      description: "Gegenseitige Unterstützung in der Nachbarschaft",
      access: "open",
      modules: ["feed", "map"],
      roles: ["admin", "member"],
      memberCount: 24,
    },
  },
  {
    id: "group-3",
    name: "Transition Town",
    data: {
      description: "Lokale Initiativen für nachhaltiges Leben",
      access: "invite-admin",
      modules: ["kanban", "calendar", "feed"],
      roles: ["admin", "member", "viewer"],
      memberCount: 8,
    },
  },
]

export const demoGroupMembers: Record<string, string[]> = {
  "group-1": ["user-1", "user-2", "user-3"],
  "group-2": ["user-1", "user-2", "user-3", "user-4"],
  "group-3": ["user-1", "user-4"],
}

export const demoItems: Item[] = [
  // --- Kanban Tasks (group-1: Gemeinschaftsgarten) ---
  {
    id: "task-1",
    type: "task",
    createdAt: new Date("2026-03-01"),
    createdBy: "user-1",
    data: {
      title: "Beete vorbereiten",
      description: "Erde umgraben und Kompost einarbeiten",
      status: "todo",
      position: 0,
      tags: ["garten"],
    },
    relations: [{ predicate: "assignedTo", target: "global:user-2" }],
  },
  {
    id: "task-2",
    type: "task",
    createdAt: new Date("2026-03-02"),
    createdBy: "user-2",
    data: {
      title: "Samen bestellen",
      description: "Tomaten, Zucchini, Kräuter",
      status: "doing",
      position: 0,
      tags: ["garten", "einkauf"],
    },
    relations: [{ predicate: "assignedTo", target: "global:user-2" }],
  },
  {
    id: "task-3",
    type: "task",
    createdAt: new Date("2026-03-03"),
    createdBy: "user-1",
    data: {
      title: "Wasserschlauch reparieren",
      description: "Leck am Verbindungsstück abdichten",
      status: "done",
      position: 0,
      tags: ["infrastruktur"],
    },
    relations: [{ predicate: "assignedTo", target: "global:user-3" }],
  },
  {
    id: "task-4",
    type: "task",
    createdAt: new Date("2026-03-04"),
    createdBy: "user-3",
    data: {
      title: "Gartenplan zeichnen",
      description: "Welches Beet bekommt welche Pflanzen?",
      status: "todo",
      position: 1,
      tags: ["planung"],
    },
  },
  {
    id: "task-5",
    type: "task",
    createdAt: new Date("2026-03-05"),
    createdBy: "user-1",
    data: {
      title: "Kompost umsetzen",
      description: "Der Kompost muss umgesetzt und belüftet werden",
      status: "doing",
      position: 1,
      tags: ["garten"],
    },
    relations: [{ predicate: "assignedTo", target: "global:user-1" }],
  },

  // --- Events (group-1) ---
  {
    id: "event-1",
    type: "event",
    createdAt: new Date("2026-03-01"),
    createdBy: "user-1",
    data: {
      title: "Pflanzaktion",
      description: "Gemeinsam Frühjahrspflanzen setzen",
      start: "2026-03-15T10:00",
      end: "2026-03-15T14:00",
      location: { lat: 50.11, lng: 8.68 },
      address: "Gemeinschaftsgarten, Musterstr. 5",
      status: "confirmed",
      tags: ["garten", "gemeinschaft"],
    },
  },
  {
    id: "event-2",
    type: "event",
    createdAt: new Date("2026-03-02"),
    createdBy: "user-2",
    data: {
      title: "Gartenplanung",
      description: "Bepflanzungsplan für die Saison besprechen",
      start: "2026-03-20T18:00",
      end: "2026-03-20T20:00",
      status: "confirmed",
      tags: ["planung"],
    },
  },

  // --- Posts (group-2: Nachbarschaftshilfe) ---
  {
    id: "post-1",
    type: "post",
    createdAt: new Date("2026-03-06T10:00"),
    createdBy: "user-2",
    data: {
      title: "Spaziergang im Park",
      content: "Wer hat Lust auf einen gemeinsamen Spaziergang im Park am Samstag? Treffpunkt wäre 14 Uhr am Eingang.",
      tags: ["freizeit"],
    },
  },
  {
    id: "post-2",
    type: "post",
    createdAt: new Date("2026-03-05T14:00"),
    createdBy: "user-3",
    data: {
      title: "Hilfe beim Umzug",
      content: "Suche jemanden der mir beim Umzug nächste Woche helfen kann. Biete Pizza und Getränke als Dankeschön!",
      tags: ["hilfe"],
    },
  },
  {
    id: "post-3",
    type: "post",
    createdAt: new Date("2026-03-04T09:00"),
    createdBy: "user-4",
    data: {
      title: "Urban Gardening Tipps",
      content: "Hat jemand Erfahrung mit Urban Gardening? Ich möchte meinen Balkon begrünen und suche Tipps für Anfänger.",
      tags: ["garten", "frage"],
    },
  },

  // --- Places (group-2) ---
  {
    id: "place-1",
    type: "place",
    createdAt: new Date("2026-02-01"),
    createdBy: "user-1",
    data: {
      title: "Gemeinschaftsgarten",
      description: "Unser Garten in der Musterstraße",
      location: { lat: 50.11, lng: 8.68 },
      address: "Musterstr. 5, 60000 Frankfurt",
      tags: ["garten"],
    },
  },
  {
    id: "place-2",
    type: "place",
    createdAt: new Date("2026-02-01"),
    createdBy: "user-2",
    data: {
      title: "Café Nachbar",
      description: "Gemütliches Café mit Gemeinschaftsraum",
      location: { lat: 50.112, lng: 8.685 },
      address: "Nachbarweg 12, 60000 Frankfurt",
      tags: ["treffpunkt"],
    },
  },

  // --- Feature Item ---
  {
    id: "feature-mock",
    type: "feature",
    createdAt: new Date("2026-01-01"),
    createdBy: "system",
    data: {
      groups: {
        create: true,
        delete: true,
        accessModes: ["open", "invite-member", "invite-admin", "closed"],
        moduleSelection: true,
        roles: true,
      },
      items: {
        create: true,
        update: true,
        delete: true,
        relations: true,
      },
      auth: {
        methods: ["mock"],
      },
    },
  },
]
