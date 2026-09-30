import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // Die Tests spielen mehrere Menschen mit vielen Klicks durch. Im Lauf aller
    // Pakete zugleich reichen die ueblichen 5 Sekunden nicht immer.
    testTimeout: 20_000,
    // Jede Datei spielt mehrere Menschen in jsdom durch. Parallel nehmen sie
    // sich im Torlauf (alle Pakete zugleich) die Rechenzeit weg, und mal der
    // eine, mal der andere Test riss die 20 Sekunden (30.09.2026). Allein
    // braucht jeder Test unter drei Sekunden.
    fileParallelism: false,
  },
})
