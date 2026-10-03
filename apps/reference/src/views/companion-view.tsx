// Die Begleitung des offenen Space, an die App gebunden.
//
// Die Flaeche liegt in `@trustdonation/ui` und liest ueber `useItems()`
// selbst. Die App reicht das Reinsprechen herein (DEFINITION 13.9): Es kennt
// die Mitschrift aus Circeling, die Flaeche nicht. Nachgeladen, erst wer die
// Begleitung oeffnet, braucht es.
//
// Definiert in `docs/DEFINITION.md` Teil 13.
import { lazy, Suspense } from "react"
import { CompanionFlaeche } from "@trustdonation/ui"
import { useDiktat } from "./diktat"

const BegleiterGespraech = lazy(() => import("@trustdonation/ui/begleiter"))

export function CompanionView() {
  const diktat = useDiktat()
  return (
    <CompanionFlaeche
      gespraech={
        <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl bg-muted" />}>
          <BegleiterGespraech diktat={diktat} />
        </Suspense>
      }
    />
  )
}
