import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // Die Tests spielen mehrere Menschen mit vielen Klicks durch. Im Lauf aller
    // Pakete zugleich reichen die ueblichen 5 Sekunden nicht immer.
    testTimeout: 20_000,
  },
})
