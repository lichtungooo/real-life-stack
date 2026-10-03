import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react"
import { useNavigate, useSearchParams, useLocation, useParams } from "react-router-dom"
import { IdCard } from "lucide-react"

import {
  AdaptivePanel,
  ProfilePanelContent,
  ConnectorSwitcher,
  ConnectorProvider,
  IncomingEventsProvider,
  useIncomingEvents,
  useConnector,
  useCurrentUser,
  useContacts,
  useRelayStatus,
  useModulePanel,
  DebugDashboard,
  RelayStatusBadge,
  AuthScreen,
  IncomingVerificationDialog,
  IncomingContactRequestDialog,
  IncomingSpaceInviteDialog,
  MutualVerificationDialog,
  getRuntimeConfig,
  useGroups,
  resolveSpaceModules,
  defaultModuleIds,
  Button,
  type ProfileData,
  type ConnectorOption,
} from "@real-life-stack/toolkit"
import type { DataInterface, User } from "@real-life-stack/data-interface"
import { isAuthenticatable, hasMessaging, hasEncounterVerification, hasProfile } from "@real-life-stack/data-interface"
// Prototyp trustdonation: Die Musterdaten kommen als Seed aus unserem Paket,
// nicht aus Antons Demodaten. Beide Connectoren nehmen einen Seed als
// Parameter, darum bleiben seine Dateien unberuehrt (NAEHTE Abschnitt C).
import { importZiel, traegtProfil } from "@trustdonation/core"
// Die Import-Dialoge starten nur über einen Link: erst dann laden (Budget, 03.10.2026).
const NetzwerkeImport = lazy(() => import("@trustdonation/ui/netzwerke-import").then((m) => ({ default: m.NetzwerkeImport })))
const StiftungenImport = lazy(() => import("@trustdonation/ui/stiftungen-import").then((m) => ({ default: m.StiftungenImport })))
import { SpaceProfilPanel } from "./views/profil-panel"
import { ERWEITERUNGEN_ABSCHNITT } from "./views/erweiterungen-abschnitt"
import { SPENDEN_ABSCHNITT, SpendenKnopf } from "./views/spenden-abschnitt"
import { KI_ABSCHNITT } from "./views/ki-abschnitt"
import { MeinProfil, persoenlicherSpace } from "./views/mein-profil"
import { ProjektEntwurfHost } from "./views/projekt-entwurf-host"
import { connectorWahl } from "./connector-wahl"
// Der Kreis bekommt seinen Raum von der App (Spec kreis, "Der Raum-Adapter").
// LiveKit unter kreis.wir.ooo traegt Bild und Ton; `?kreis=lokal` waehlt den
// Probe-Raum, der nur die Fenster auf einem Geraet verbindet, ohne Server.
import { lokalerKreisRaum } from "@kreis/core"
import { KreisRaumProvider } from "@kreis/ui/raum"
import { liveKitKreisRaum, KREIS_WIR_OOO } from "@kreis/livekit"

// Einmal gewaehlt, fuer die ganze Sitzung: Die Fabrik darf nicht bei jedem
// Rendern neu entstehen, sonst baute der Provider die Verbindung neu auf.
// `?video=720` (oder 360) stellt die Kamera-Aufnahme fuer einen Vergleich
// um; ohne Angabe gilt 540p (gemessen, siehe kreis-livekit).
function videoAusAdresse(): "h360" | "h540" | "h720" | undefined {
  const v = new URLSearchParams(window.location.search).get("video")
  return v === "720" ? "h720" : v === "360" ? "h360" : v === "540" ? "h540" : undefined
}
// `?codec=h264` (vp8, vp9, av1) fuer denselben Vergleich beim Kodieren.
function codecAusAdresse(): "vp8" | "h264" | "vp9" | "av1" | undefined {
  const c = new URLSearchParams(window.location.search).get("codec")
  return c === "vp8" || c === "h264" || c === "vp9" || c === "av1" ? c : undefined
}
const kreisFabrik = new URLSearchParams(window.location.search).get("kreis") === "lokal"
  ? () => lokalerKreisRaum()
  : () => liveKitKreisRaum({ ...KREIS_WIR_OOO, video: videoAusAdresse(), codec: codecAusAdresse() })
import { MapLibreAdapterProvider } from "@real-life-stack/toolkit/maplibre"
import { LocalConnector } from "@real-life-stack/local-connector"
// Der Rahmen mit Router: Fokus in der URL, Space/Modul/Item aus der URL,
// Provider, Panel, Kopfzeile, Controller — einmal im Toolkit (Spec 01).
import { RoutedAppFrame } from "@real-life-stack/toolkit/router"


const CONNECTOR_OPTIONS: ConnectorOption[] = [
  { id: "mock", name: "Mock", description: "In-Memory, kein Speichern" },
  { id: "local", name: "Local", description: "IndexedDB, persistent" },
  { id: "wot", name: "Web of Trust", description: "E2E-verschlüsselt, Multi-Device" },
  { id: "supabase", name: "Supabase", description: "PostgreSQL-Backend, Realtime" },
]

function RelayStatusBadgeWrapper() {
  const { state, pendingCount } = useRelayStatus()
  const panel = useModulePanel()
  // Debug shares the one app-level panel (content-swap). Toggle: a badge
  // click opens debug into the panel, or closes it if it's already showing.
  const toggleDebug = () => {
    if (panel.current?.kind === "debug") {
      panel.close()
    } else {
      panel.open({
        kind: "debug",
        content: <DebugDashboard />,
      })
    }
  }
  return (
    <RelayStatusBadge
      state={state}
      pendingCount={pendingCount}
      onClick={toggleDebug}
    />
  )
}

/**
 * Global incoming event dialogs — counter-verify, space invite, mutual verification.
 * Must be rendered inside IncomingEventsProvider.
 */
function IncomingEventDialogs({ onCloseVerifyDialog }: { onCloseVerifyDialog?: () => void }) {
  const connector = useConnector()
  const { data: currentUser } = useCurrentUser()
  const { current: currentNotification, incomingVerification, spaceInvite, mutualVerification, contactRequest, contactConfirmed, dismiss } = useIncomingEvents()
  const { activateContact: activateIncomingContact } = useContacts()

  const handleConfirmContactRequest = async () => {
    if (!contactRequest) return
    // Fehler NICHT schlucken: der Dialog zeigt ihn und bleibt offen
    // (retry-fähig). Nur der Erfolg schließt.
    await activateIncomingContact(contactRequest.fromId)
    dismiss()
  }

  const handleCounterVerify = async () => {
    if (!incomingVerification || !hasEncounterVerification(connector)) return
    await connector.counterVerify(incomingVerification.fromId)
    dismiss()
  }

  const navigate = useNavigate()
  const handleOpenSpace = () => {
    if (spaceInvite) {
      navigate(`/${spaceInvite.spaceId}/feed`)
    }
    dismiss()
  }

  // Close the verify dialog when an incoming/mutual verification arrives
  useEffect(() => {
    if (incomingVerification || mutualVerification) onCloseVerifyDialog?.()
  }, [incomingVerification, mutualVerification, onCloseVerifyDialog])

  return (
    <>
      <IncomingVerificationDialog
        open={!!incomingVerification}
        fromId={incomingVerification?.fromId ?? ""}
        fromName={incomingVerification?.fromName}
        fromAvatar={incomingVerification?.fromAvatar}
        onConfirm={handleCounterVerify}
        onReject={dismiss}
      />
      <IncomingSpaceInviteDialog
        open={!!spaceInvite}
        spaceName={spaceInvite?.spaceName ?? ""}
        spaceImage={spaceInvite?.spaceImage}
        inviterName={spaceInvite?.fromName}
        onOpen={handleOpenSpace}
        onDismiss={dismiss}
      />
      <MutualVerificationDialog
        open={!!mutualVerification}
        peerName={mutualVerification?.fromName}
        peerAvatar={mutualVerification?.fromAvatar}
        myName={currentUser?.displayName}
        myAvatar={currentUser?.avatarUrl}
        onDismiss={dismiss}
      />
      {/* Gleiche Komponente, andere Variante: Anfrage-Bestätigung statt
          Begegnungs-Verifikation. */}
      <MutualVerificationDialog
        open={!!contactConfirmed}
        variant="contact"
        peerName={contactConfirmed?.fromName}
        peerAvatar={contactConfirmed?.fromAvatar}
        myName={currentUser?.displayName}
        myAvatar={currentUser?.avatarUrl}
        onDismiss={dismiss}
      />
      <IncomingContactRequestDialog
        open={!!contactRequest}
        requestKey={currentNotification?.id}
        fromId={contactRequest?.fromId}
        fromName={contactRequest?.fromName}
        fromAvatar={contactRequest?.fromAvatar}
        onConfirm={handleConfirmContactRequest}
        onDismiss={dismiss}
      />
    </>
  )
}

/**
 * Single App-Shell-level profile surface. Holds one AdaptivePanel that
 * both the own-profile editor and read-only foreign profiles render
 * into — opened from anywhere via the OpenProfileProvider. Modal by
 * default so an avatar click inside an open item-detail sidebar stacks
 * above it instead of replacing it.
 */
export function ProfilePanelHost({
  userId,
  currentUser,
  connector,
  contactCount,
  onSaveProfile,
  onClose,
  onAddContact,
  contactStatusFor,
  contactDirectionFor,
}: {
  userId: string | null
  currentUser: User | null | undefined
  connector: DataInterface
  contactCount?: number
  onSaveProfile: (updates: { name: string; bio: string; avatar?: string }) => Promise<void>
  onClose: () => void
  onAddContact?: (id: string) => Promise<unknown>
  contactStatusFor?: (id: string) => "pending" | "active" | undefined
  contactDirectionFor?: (id: string) => "incoming" | "outgoing" | undefined
}) {
  const isOwn = userId != null && userId === currentUser?.id
  const [foreign, setForeign] = useState<User | null>(null)

  // Own bio lives in the connector's profile item (person/v1), not in the
  // User object — without this the editor reopens with an empty bio even
  // though updateMyProfile persisted it (applies to WoT and Supabase alike).
  const [myBio, setMyBio] = useState("")
  useEffect(() => {
    if (!isOwn || !hasProfile(connector)) {
      setMyBio("")
      return
    }
    // Stale/error guard: a resolve after the effect re-ran (connector or
    // profile switch) must not apply, and a rejecting connector must not
    // surface as unhandledrejection.
    let cancelled = false
    const observable = connector.observeMyProfile()
    const apply = (item: import("@real-life-stack/data-interface").Item | null) => {
      if (cancelled) return
      setMyBio(typeof item?.data.bio === "string" ? item.data.bio : "")
    }
    apply(observable.current)
    connector.getMyProfile().then(apply).catch((error) => {
      console.error("[ProfilePanelHost] getMyProfile failed", error)
    })
    const unsubscribe = observable.subscribe(apply)
    return () => { cancelled = true; unsubscribe() }
  }, [isOwn, connector])

  useEffect(() => {
    // Clear any previously loaded user first, so switching from one
    // foreign profile to another doesn't briefly show the stale one.
    setForeign(null)
    if (userId == null || isOwn) return
    let cancelled = false
    if (isAuthenticatable(connector)) {
      connector.getUser(userId)
        .then((u) => { if (!cancelled) setForeign(u) })
        .catch(() => { if (!cancelled) setForeign(null) })
    }
    return () => { cancelled = true }
  }, [userId, isOwn, connector])

  const profile: ProfileData | null = useMemo(() => {
    if (userId == null) return null
    if (isOwn) {
      return {
        did: currentUser?.id ?? "",
        name: currentUser?.displayName ?? "",
        bio: myBio,
        avatar: currentUser?.avatarUrl,
      }
    }
    // Foreign profile: use the loaded user, fall back to the bare id
    // while getUser is still resolving (or if the connector can't
    // resolve it).
    return {
      did: foreign?.id ?? userId,
      name: foreign?.displayName ?? userId,
      avatar: foreign?.avatarUrl,
    }
  }, [userId, isOwn, currentUser, foreign, myBio])

  // Das eigene Profil im Aufbau der anderen Profile, mit Sichtbarkeit je
  // Angabe (DEFINITION 9.1). Fremde Profile zeigt weiter Antons Fläche.
  // Mit persönlichem Space (WoT) das neue Profil; ganz ohne Profil (Beispielwelt)
  // das Muster; sonst (etwa Supabase) bleibt Antons Panel.
  const persoenlich = isOwn ? persoenlicherSpace(connector) : null
  if (isOwn && (persoenlich || !hasProfile(connector))) {
    return (
      <MeinProfil connector={connector} persoenlich={persoenlich} ich={currentUser} bio={myBio} offen={userId !== null} onOffen={(x) => { if (!x) onClose() }}
        profilLink={`${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(userId ?? "")}`} />
    )
  }

  return (
    <AdaptivePanel
      open={userId !== null}
      onClose={onClose}
      allowedModes={["modal"]}
      modalClassName="sm:max-w-sm"
    >
      {profile && (
        // Two concrete branches so the discriminated union narrows:
        // edit carries onSave, view forbids it.
        isOwn ? (
          <ProfilePanelContent
            key={profile.did}
            mode="edit"
            profile={profile}
            contactCount={contactCount}
            onSave={onSaveProfile}
            onClose={onClose}
            profileUrl={`${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(profile.did)}`}
          />
        ) : (
          <ProfilePanelContent
            key={profile.did}
            mode="view"
            profile={profile}
            onClose={onClose}
            onAddContact={onAddContact && userId ? () => onAddContact(userId) : undefined}
            contactStatus={userId ? contactStatusFor?.(userId) : undefined}
            contactDirection={userId ? contactDirectionFor?.(userId) : undefined}
          />
        )
      )}
    </AdaptivePanel>
  )
}

/**
 * Die Shell der Referenz-App: der Rahmen aus dem Toolkit (`RoutedAppFrame`,
 * Spec 01 „Was bei der App bleibt") plus das, was nur diese App hat — das
 * Profil-Overlay in der URL, die WoT-Ereignisdialoge, der Relay-Status, der
 * Connector-Umschalter im Dev-Modus. Bis zum 21.09.2026 zaehlte `Home` hier
 * zehn Provider und vier Controller von Hand auf.
 */
function Home({ activeConnectorId, onConnectorChange }: { activeConnectorId: string; onConnectorChange: (id: string) => void }) {
  const connector = useConnector()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()
  const { activeContacts, contacts: allContacts, addContact, supportsContacts } = useContacts()

  // Das Profil-Overlay lebt in der URL (`?profile={userId}`): verlinkbar, und
  // Zurueck im Browser schliesst es (derselbe Push-Marker wie der
  // Dialog-Stack des Rahmens). Bleibt App-Sache, bis das Profil ein Item ist.
  const profileUserId = searchParams.get("profile")
  const openProfile = useCallback((userId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("profile", userId)
    const prev = (typeof location.state === "object" && location.state) || {}
    setSearchParams(params, { state: { ...prev, rlsDialogPush: true } })
  }, [searchParams, setSearchParams, location.state])
  const closeProfile = useCallback(() => {
    const pushed = (location.state as { rlsDialogPush?: boolean } | null)?.rlsDialogPush
    if (pushed) {
      navigate(-1)
    } else {
      const params = new URLSearchParams(searchParams)
      params.delete("profile")
      setSearchParams(params, { replace: true })
    }
  }, [location.state, navigate, searchParams, setSearchParams])
  const { data: alleGroups } = useGroups()
  const spaceModule = useCallback(
    (id: string) => (alleGroups ?? []).find((g) => g.id === id)?.data?.modules as string[] | undefined,
    [alleGroups],
  )
  const handleSaveProfile = useCallback(async (updates: { name: string; bio: string; avatar?: string }) => {
    if (hasProfile(connector)) await connector.updateMyProfile(updates)
  }, [connector])
  // Eine eingehende Verifikation schliesst den eigenen Verify-Dialog des
  // Rahmens (`?dialog=…,verify`) — per replace, ohne die App zu verlassen.
  const closeVerifyOverlay = useCallback(() => {
    const stack = searchParams.get("dialog")?.split(",") ?? []
    if (!stack.includes("verify")) return
    const next = stack.filter((x) => x !== "verify")
    const params = new URLSearchParams(searchParams)
    if (next.length > 0) params.set("dialog", next.join(","))
    else params.delete("dialog")
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <MapLibreAdapterProvider>
      <KreisRaumProvider fabrik={kreisFabrik} kennung={currentUser?.id ?? null}>
      <RoutedAppFrame
        fallbackModule="feed"
        build={__RLS_BUILD__}
        openProfile={openProfile}
        // Der Link fuer den Knopf auf einer Landingpage: die Domain des
        // Netzwerks, wenn es eine hat (dort laeuft seine eigene Instanz unter
        // /app), sonst die Adresse, unter der die App gerade laeuft. Einstieg
        // ist das erste Modul des Space, wie beim Space-Wechsel.
        // Die Erweiterungen im Space-Dialog, ueber Antons App-Abschnitte
        // (rls#551, DEFINITION Teil 8). Der Baukasten als Modul ist raus.
        // Spenden über Open Collective (DEFINITION Teil 8, 03.10.2026).
        spaceSections={[ERWEITERUNGEN_ABSCHNITT, SPENDEN_ABSCHNITT, KI_ABSCHNITT]}
        spaceSectionsTitle="Mehr"
        spaceLink={(id, domain) => {
          const start = resolveSpaceModules(spaceModule(id))[0]
          return domain ? `https://${domain}/app/${id}/${start}` : `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/+$/, "")}/${id}/${start}`
        }}
        navbarEnd={
          <>
            <BeispieldatenHinweis aktiv={activeConnectorId === "local"} />
            <NetzwerkeKnopf aktiv={activeConnectorId !== "local"} />
            {hasMessaging(connector) ? <RelayStatusBadgeWrapper /> : null}
            <SpendenKnopf />
            <SpaceProfilKnopf />
          </>
        }
      >
        <SpaceProfilHost />
        {/* Prototyp trustdonation: die recherchierten Stiftungen in einen echten
            Space übernehmen. Über die Adresse ausgelöst, damit es keinen Knopf
            gibt, den eine Stiftung versehentlich drückt:
            .../<space>/feed?connector=wot&import=stiftungen */}
        <StiftungenImportHost beispielwelt={activeConnectorId === "local"} />
        {/* Ein Projektprofil aus dem Entwurf eines Agenten (td-mcp): Der Link
            traegt ihn im Fragment, der Mensch legt selbst an (DEFINITION 13.6). */}
        <ProjektEntwurfHost beispielwelt={activeConnectorId === "local"} />
        {/* Unsere Netzwerke als echte Spaces anlegen (Timo, 30.09.2026).
            Ausgeloest ueber den Knopf in der Kopfzeile oder ?import=netzwerke. */}
        <NetzwerkeImportHost beispielwelt={activeConnectorId === "local"} />
        {/* Einladungslink in die Konferenz (?konferenz=<gruppe>&gruppe=<name>):
            Mitglieder springen in die Konferenz ihrer Gruppe, Neue landen in
            der Beitritts-Konferenz, bis die Runde sie aufnimmt. */}
        <KonferenzBeitrittHost />
        <ProfilePanelHost
          userId={profileUserId}
          currentUser={currentUser}
          connector={connector}
          contactCount={activeContacts.length}
          onSaveProfile={handleSaveProfile}
          onClose={closeProfile}
          onAddContact={supportsContacts ? addContact : undefined}
          contactStatusFor={(id) => allContacts.find((contact) => contact.id === id)?.status}
          contactDirectionFor={(id) => allContacts.find((contact) => contact.id === id)?.direction}
        />
        <IncomingEventDialogs onCloseVerifyDialog={closeVerifyOverlay} />
        {/* Connector FAB — bottom-left, above BottomNav (only with ?dev URL param) */}
        {initialDevMode && (
          <div className="fixed bottom-20 left-4 z-50">
            <ConnectorSwitcher
              connectors={CONNECTOR_OPTIONS}
              activeConnector={activeConnectorId}
              onConnectorChange={onConnectorChange}
            />
          </div>
        )}
      </RoutedAppFrame>
      </KreisRaumProvider>
    </MapLibreAdapterProvider>
  )
}


async function createConnector(type: string): Promise<DataInterface> {
  if (type === "wot") {
    const { WotConnector } = await import("@real-life-stack/wot-connector")
    // 0.3.0: vaultUrl entfernt (Connector nutzt kein Vault); Defaults auf die
    // aktiven web-of-trust.de-Dienste (utopia-lab-Legacy ist abgeschaltet).
    // Endpunkte kommen zur Laufzeit (Spec 11) — dasselbe Artefakt bedient
    // damit jede Instanz; die VITE_-Werte tragen als Stufe 2 weiter.
    const { relayUrl, profilesUrl } = getRuntimeConfig().endpoints
    const connector = new WotConnector({
      relayUrl: relayUrl ?? "wss://relay.web-of-trust.de",
      profilesUrl: profilesUrl ?? "https://profiles.web-of-trust.de",
    })
    await connector.init()
    return connector
  }
  if (type === "local") {
    // `?identity=tab`: jeder Browser-Tab ist eine eigene Person — zum Testen
    // von Mehrpersonen-Geschichten (Abstimmen, Varianten, Einfrieren).
    const identity = new URLSearchParams(window.location.search).get("identity") === "tab" ? "per-tab" : "shared"
    // Die Musterdaten werden nachgeladen statt mitgeliefert: 308 KB, die
    // sonst jeder laedt, auch wer die Beispielwelt nie sieht (20.09.2026).
    const { musterdaten } = await import("@trustdonation/core/musterdaten")
    const c = new LocalConnector(musterdaten, { identity })
    await c.init()
    return c
  }
  if (type === "supabase") {
    const { createSupabaseConnector } = await import("@real-life-stack/supabase-connector")
    const { supabaseUrl, supabaseAnonKey } = getRuntimeConfig().endpoints
    const connector = createSupabaseConnector(
      supabaseUrl ?? "http://127.0.0.1:54321",
      supabaseAnonKey ?? "",
    )
    await connector.init()
    // No auto-login: the AuthGate presents the generic AuthScreen (email
    // login/signup + anonymous). supabase-js persists sessions, so an
    // existing login survives reloads and skips the gate.
    return connector
  }
  const { musterdaten } = await import("@trustdonation/core/musterdaten")
  // Nur auf Wunsch (?connector=mock): nachgeladen, nicht im Hauptteil (Budget, 03.10.2026).
  const { MockConnector } = await import("@real-life-stack/mock-connector")
  const c = new MockConnector(musterdaten)
  await c.init()
  return c
}


// ---------------------------------------------------------------------------
// Prototyp trustdonation: was die App an den Rahmen haengt (navbarEnd,
// children). Alles liest den Space aus der URL (`/:scope/...`), denn der
// Rahmen legt seine Routen um genau diese Flaechen.

/**
 * Wer Beispieldaten sieht, soll es wissen. Der Prototyp startet mit dem
 * local-Connector, damit eine Stiftung ohne Anmeldung etwas sieht (E4). Ohne
 * diesen Hinweis haelt jeder das Gezeigte fuer sein eigenes Konto.
 */
function BeispieldatenHinweis({ aktiv }: { aktiv: boolean }) {
  if (!aktiv) return null
  return (
    <a
      href={`${import.meta.env.BASE_URL}?connector=wot`}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
      title="Diese Ansicht zeigt Beispieldaten. Hier geht es zum eigenen Konto im Web of Trust."
    >
      Beispieldaten
      <span aria-hidden="true">·</span>
      <span className="font-medium">Mein Konto</span>
    </a>
  )
}

/**
 * Im Login ohne ein einziges Netzwerk: der Weg zur Ordnung der Demo (Timo,
 * 30.09.2026: "Die Gruppen genauso, wie sie in der Demo-Version sind").
 * Sobald ein Netzwerk da ist, verschwindet der Knopf.
 */
function NetzwerkeKnopf({ aktiv }: { aktiv: boolean }) {
  const { data: groups, isLoading } = useGroups()
  const [searchParams, setSearchParams] = useSearchParams()
  if (!aktiv || isLoading || !groups) return null
  if (groups.some((g) => g.data?.isNetwork === true)) return null
  return (
    <button
      type="button"
      onClick={() => { const p = new URLSearchParams(searchParams); p.set("import", "netzwerke"); setSearchParams(p) }}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
      title="Die Netzwerke, Projekte und Stiftungen der Demo als echte Spaces anlegen"
    >
      Netzwerke übernehmen
    </button>
  )
}

function NetzwerkeImportHost({ beispielwelt }: { beispielwelt: boolean }) {
  const connector = useConnector()
  const [searchParams, setSearchParams] = useSearchParams()
  const zu = useCallback(() => {
    const p = new URLSearchParams(searchParams)
    p.delete("import")
    setSearchParams(p)
  }, [searchParams, setSearchParams])
  if (searchParams.get("import") !== "netzwerke") return null
  return (
    <Suspense fallback={null}>
      <NetzwerkeImport
        connector={connector}
        aktiv
        beispielwelt={beispielwelt}
        module={defaultModuleIds()}
        onZu={zu}
      />
    </Suspense>
  )
}

// Excalidraw (Zeichenpad) laedt seine Schriften von hier, nicht aus einem
// fremden Netz (public/excalidraw/fonts, Open Source, selbst ausgeliefert).
;(window as unknown as { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH =
  // BASE_URL heisst live "/app", ohne Schraegstrich am Ende (01.10.2026: so
  // wurde daraus "/appexcalidraw/" und die Schriften fehlten).
  `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/+$/, "")}/excalidraw/`

const BeitrittLazy = lazy(() => import("@kreis/ui/flaechen").then((m) => ({ default: m.BeitrittsKonferenz })))

/**
 * Wer ueber einen Einladungslink kommt (Timo, 30.09.2026: "falls noch ein
 * Nutzer mit beitreten will, der noch nie drin war"). Ist er Mitglied der
 * Gruppe, fuehrt der Weg direkt in ihre Konferenz. Sonst sitzt er in der
 * Beitritts-Konferenz, im selben Raum, bis ihn jemand aufnimmt; sobald die
 * Gruppe bei ihm ankommt, wechselt die Flaeche, und die Verbindung bleibt.
 */
function KonferenzBeitrittHost() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: groups, isLoading } = useGroups()
  const gruppeId = searchParams.get("konferenz")
  const gruppeName = searchParams.get("gruppe") ?? "Konferenz"
  const gruppe = gruppeId ? (groups ?? []).find((g) => g.id === gruppeId) : undefined
  const mitglied = !!gruppe
  // Führt die Gruppe keine Konferenz, leitete der Weg still auf den Feed um,
  // und der Eingeladene verstand nicht, warum (Prüfkreis Kimi, 02.10.2026).
  const ohneKonferenz = !!gruppe && !resolveSpaceModules(gruppe.data?.modules as string[] | undefined).includes("video")

  useEffect(() => {
    if (!gruppeId || !mitglied || ohneKonferenz) return
    const p = new URLSearchParams(searchParams)
    p.delete("konferenz")
    p.delete("gruppe")
    const rest = p.toString()
    navigate(`/${gruppeId}/video${rest ? `?${rest}` : ""}${location.hash}`, { replace: true })
  }, [gruppeId, mitglied, ohneKonferenz, searchParams, navigate, location.hash])

  const schliessen = () => {
    const p = new URLSearchParams(searchParams)
    p.delete("konferenz")
    p.delete("gruppe")
    setSearchParams(p)
  }
  if (gruppeId && ohneKonferenz) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
        <div role="dialog" aria-label="Keine Konferenz in dieser Gruppe" className="w-full max-w-sm rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
          <h2 className="text-lg font-semibold">{gruppe?.name ?? gruppeName} führt keine Konferenz</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Die Einladung führt in die Konferenz dieser Gruppe, doch Circeling ist hier nicht eingeschaltet.
            Wer die Gruppe verwaltet, schaltet es im Space-Dialog unter Erweiterungen ein.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={schliessen} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted">Schließen</button>
            <button type="button" onClick={() => { schliessen(); navigate(`/${gruppeId}`) }}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">Zur Gruppe</button>
          </div>
        </div>
      </div>
    )
  }
  if (!gruppeId || isLoading || mitglied) return null
  return (
    <div className="fixed inset-0 z-[70] bg-slate-950">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Einen Moment …</div>}>
        <BeitrittLazy raumId={gruppeId} raumName={gruppeName} onSchliessen={schliessen} />
      </Suspense>
    </div>
  )
}

/** Das Profil eines Space oeffnen und schliessen, in der URL (`?profil=`). */
function useSpaceProfil() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const offen = searchParams.get("profil")
  const oeffnen = useCallback((groupId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("profil", groupId)
    const prev = (typeof location.state === "object" && location.state) || {}
    setSearchParams(params, { state: { ...prev, rlsDialogPush: true } })
  }, [searchParams, setSearchParams, location.state])
  const schliessen = useCallback(() => {
    const pushed = (location.state as { rlsDialogPush?: boolean } | null)?.rlsDialogPush
    if (pushed) { navigate(-1); return }
    const params = new URLSearchParams(searchParams)
    params.delete("profil")
    setSearchParams(params, { replace: true })
  }, [location.state, navigate, searchParams, setSearchParams])
  return { offen, oeffnen, schliessen }
}

/**
 * Die Taste zum Profil des offenen Space, rechts neben dem des Menschen.
 * Zwei Schreibweisen, ein Buchstabe Unterschied: `profile` traegt eine
 * Nutzer-Id, `profil` eine Space-Id. Das ist Absicht (docs/13-profil.md).
 * Die Uebersicht und ein Netzwerk bleiben aussen vor: `traegtProfil` sagt,
 * dass sie keine Einrichtung sind.
 */
function SpaceProfilKnopf() {
  const { scope } = useParams()
  const { data: groups } = useGroups()
  const { oeffnen } = useSpaceProfil()
  const group = scope ? (groups ?? []).find((g) => g.id === scope) : undefined
  if (!group || !traegtProfil((group.data ?? {}) as Record<string, unknown>)) return null
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => oeffnen(group.id)}
      aria-label={`Profil von ${group.name} ansehen`}
      title={`Profil von ${group.name}`}
      className="h-9 w-9"
    >
      <IdCard className="h-4 w-4" />
    </Button>
  )
}

/** Ein Panel je Art von Profil, dieselbe Flaeche rechts: ein Mensch und eine Einrichtung. */
function SpaceProfilHost() {
  const { offen, schliessen } = useSpaceProfil()
  return <SpaceProfilPanel groupId={offen} onClose={schliessen} />
}

function StiftungenImportHost({ beispielwelt }: { beispielwelt: boolean }) {
  const connector = useConnector()
  const { scope } = useParams()
  const { data: groups, isLoading } = useGroups()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const aktiv = searchParams.get("import") === "stiftungen"
  const space = scope ? (groups ?? []).find((g) => g.id === scope) : undefined
  // Ein Link fuer alles (Timo, 01.10.2026: "pack alle Stiftungen auf die
  // trustdonation, auf beide"): Ohne offenen Space sucht der Import das
  // Netzwerk trustdonation selbst und springt hinein; geschrieben wird erst
  // nach der Rueckfrage dort.
  const ziel = importZiel(groups ?? [])
  useEffect(() => {
    if (aktiv && !beispielwelt && !space && ziel) navigate(`/${ziel.id}/feed?${searchParams.toString()}`, { replace: true })
  }, [aktiv, beispielwelt, space, ziel, navigate, searchParams])
  const ohneZiel = aktiv && !beispielwelt && !space && !ziel && !isLoading
    ? "Es gibt bei dir noch keinen Space „trustdonation“. Zuerst oben „Netzwerke übernehmen“ wählen, dann diesen Link noch einmal öffnen."
    : undefined
  if (!aktiv || (!beispielwelt && !space && !ohneZiel)) return null
  return (
    <Suspense fallback={null}>
      <StiftungenImport
        connector={connector}
        aktiv
        spaceName={space?.name}
        beispielwelt={beispielwelt}
        ohneZiel={ohneZiel}
        zielId={space?.id}
      />
    </Suspense>
  )
}

const STORAGE_KEY_CONNECTOR = "rls-connector"
const initialDevMode = new URLSearchParams(window.location.search).has('dev')

function getInitialConnectorId(): string {
  // Adresse, dann die letzte eigene Wahl, dann die Vorgabe der Instanz:
  // Demo und Login bleiben getrennt, ein Neuladen bleibt im Login (Timo, 03.10.2026).
  let gespeichert: string | null = null
  try { gespeichert = localStorage.getItem(STORAGE_KEY_CONNECTOR) } catch { /* ohne Speicher: Vorgabe */ }
  return connectorWahl({
    url: new URLSearchParams(window.location.search).get("connector"),
    gespeichert,
    vorgabe: getRuntimeConfig().defaultConnector,
    bekannt: CONNECTOR_OPTIONS.map((o) => o.id),
  })
}

// Lazy-load the DIDAuthScreen to keep WoT bundle separate
const LazyDIDAuthScreen = lazy(() =>
  import("@real-life-stack/wot-connector/components").then((m) => ({
    default: m.DIDAuthScreen,
  }))
)

/** Methods the generic AuthScreen can actually present. */
const GENERIC_AUTH_METHODS = new Set(["email", "email-signup", "anonymous"])

export function AuthGate({ connector, wot, children }: { connector: DataInterface; wot: boolean; children: React.ReactNode }) {
  // WoT: check auth state once at mount and LATCH — the DIDAuthScreen controls
  // when onAuthenticated fires (after seed backup etc.), so reacting to auth
  // state changes would skip the onboarding wizard.
  const [authenticated, setAuthenticated] = useState(() => {
    if (!isAuthenticatable(connector)) return true
    return connector.getAuthState().current.status === "authenticated"
  })

  // Generic backend path: the gate FOLLOWS the auth observable (spec
  // architektur2 → AuthState als Observable). A later session loss — expiry,
  // refresh failure, logout in another tab — must close the app again, and an
  // external login must open it.
  useEffect(() => {
    if (wot || !isAuthenticatable(connector)) return
    const observable = connector.getAuthState()
    setAuthenticated(observable.current.status === "authenticated")
    return observable.subscribe((state) => setAuthenticated(state.status === "authenticated"))
  }, [connector, wot])

  if (authenticated) {
    return <>{children}</>
  }

  if (!wot) {
    // Generic capability path (e.g. Supabase): email login/signup + anonymous.
    // A connector that offers none of these has no interactive flow — pass
    // through instead of dead-ending (matches the pre-gate behaviour of the
    // auto-authenticating demo connectors).
    if (isAuthenticatable(connector) && connector.getAuthMethods().some(({ method }) => GENERIC_AUTH_METHODS.has(method))) {
      return <AuthScreen connector={connector} onAuthenticated={() => setAuthenticated(true)} />
    }
    return <>{children}</>
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Lade Auth…</div>
        </div>
      }
    >
      {/* Demo und Login getrennt (Timo, 03.10.2026): Hat die Instanz eine
          Demo, führt ein Link zurück; ein Neuladen bleibt im Login. */}
      {getRuntimeConfig().defaultConnector === "local" && (
        <a href={`${import.meta.env.BASE_URL.replace(/\/+$/, "")}/?connector=local`}
          className="fixed left-4 top-4 z-50 rounded-full bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:text-foreground">
          ← Zu den Beispieldaten
        </a>
      )}
      <LazyDIDAuthScreen
        connector={connector as unknown as import("@real-life-stack/wot-connector").WotConnector}
        onAuthenticated={() => setAuthenticated(true)}
      />
    </Suspense>
  )
}

export default function App() {
  const [connectorId, setConnectorId] = useState(getInitialConnectorId)
  const [connector, setConnector] = useState<DataInterface | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONNECTOR, connectorId)
    setLoading(true)
    setConnector(null)
    let cancelled = false
    let instance: DataInterface | null = null
    createConnector(connectorId).then((c) => {
      if (cancelled) return // Don't dispose — global singletons (PersonalDoc) are shared
      instance = c
      setConnector(c)
      setLoading(false)
    }).catch((err) => {
      console.error("[App] Failed to create connector:", err)
      if (!cancelled) setLoading(false) // Show empty state instead of infinite loader
    })
    return () => {
      cancelled = true
      // Only dispose on real unmount (connector switch), not Strict Mode re-mount.
      // We detect this by checking if the connector was actually set.
      if (instance) {
        instance.dispose()
      }
    }
  }, [connectorId])

  if (loading || !connector) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Lade {CONNECTOR_OPTIONS.find((o) => o.id === connectorId)?.name ?? connectorId}…
        </div>
      </div>
    )
  }

  return (
    <ConnectorProvider connector={connector} key={connectorId}>
      <IncomingEventsProvider>
        <AuthGate connector={connector} wot={connectorId === "wot"}>
          {/* Focus lives above the routes so it survives module switches — the
              shared panel's onClose must clear the focus on whatever module the
              user is on now, not the one that opened it. */}
          {/* Fokus, Routen (flaches Schema `/{scope}/{modul}/{item}`) und der
              Rahmen kommen aus `RoutedAppFrame`; Home stellt nur, was diese
              App zusaetzlich hat. */}
          <Home activeConnectorId={connectorId} onConnectorChange={setConnectorId} />
        </AuthGate>
      </IncomingEventsProvider>
    </ConnectorProvider>
  )
}
