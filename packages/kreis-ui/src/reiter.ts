// Von einem Modul ins andere wechseln, ohne die Verbindung zu trennen.
//
// Antons Rahmen fuehrt Space und Modul in der URL (`/{scope}/{modul}`, Spec 01,
// Der Modul-Host). Ein Modul, das in ein anderes fuehren will, geht darum
// denselben Weg: die Adresse wechseln, Suche und Fragment behalten (sie
// waehlen Connector und Entwicklermodus, siehe `canonicalPath`).

import { useCallback } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getModule, resolveSpaceModules, useGroups } from "@real-life-stack/toolkit"

export function useReiterWechsel(groupId: string) {
  const navigate = useNavigate()
  const location = useLocation()
  const { scope } = useParams()
  const { data: groups } = useGroups()
  const module = resolveSpaceModules(
    (groups ?? []).find((g) => g.id === groupId)?.data?.modules as string[] | undefined,
  )
  /** Fuehrt der Space dieses Modul? Nur dann gibt es einen Weg dorthin. */
  const fuehrt = useCallback((id: string) => module.includes(id) && !!getModule(id)?.view, [module])
  const wechseln = useCallback((id: string) => {
    navigate(`/${scope ?? groupId}/${id}${location.search}${location.hash}`)
  }, [navigate, scope, groupId, location.search, location.hash])
  return { fuehrt, wechseln, module }
}
