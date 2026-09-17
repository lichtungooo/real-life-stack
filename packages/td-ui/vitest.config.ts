import { defineConfig } from "vitest/config"
import { resolve } from "path"

// Antons Toolkit löst `@/` auf sein eigenes src auf. Wer eine Komponente von
// dort in einem Test lädt, braucht denselben Alias, sonst bricht der Import.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "../toolkit/src"),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
})
