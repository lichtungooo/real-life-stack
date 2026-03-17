import { useEffect, useMemo, useState } from "react"
import type { Item, RelatedItemsOptions } from "@real-life-stack/data-interface"
import { hasRelations } from "@real-life-stack/data-interface"
import { useConnector } from "./connector-context"

export function useRelatedItems(
  itemId: string,
  predicate?: string,
  options?: RelatedItemsOptions
) {
  const connector = useConnector()
  const supportsRelations = hasRelations(connector)
  const optionsKey = JSON.stringify(options ?? {})

  const observable = useMemo(() => {
    if (!supportsRelations) return null
    return connector.observeRelatedItems(itemId, predicate, options)
  }, [connector, supportsRelations, itemId, predicate, optionsKey])

  const [data, setData] = useState<Item[]>(observable?.current ?? [])

  useEffect(() => {
    if (!observable) return
    setData(observable.current)
    return observable.subscribe(setData)
  }, [observable])

  return { data }
}
