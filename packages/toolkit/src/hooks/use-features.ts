import { useItems } from "./use-items"

export function useFeatures(): Record<string, unknown> {
  const { data } = useItems({ type: "feature" })
  return data?.[0]?.data ?? {}
}

export function useFeature(path: string): boolean {
  const features = useFeatures()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((obj, key) => obj?.[key], features) ? true : false
}
