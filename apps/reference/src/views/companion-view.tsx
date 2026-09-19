// Die Begleitung des offenen Space, an die App gebunden.
//
// Die Flaeche liegt in `@trustdonation/ui` und liest ueber `useItems()`
// selbst. Hier bleibt darum nichts zu verbinden: Der Wrapper steht, damit
// das Register eine Sicht mit dem gemeinsamen Vertrag bekommt.
//
// Definiert in `docs/DEFINITION.md` Teil 13.
import { CompanionFlaeche } from "@trustdonation/ui"

export function CompanionView() {
  return <CompanionFlaeche />
}
