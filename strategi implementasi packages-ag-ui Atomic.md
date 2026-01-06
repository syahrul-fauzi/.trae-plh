# Rancangan & Rencana Implementasi — **packages/ag-ui/** (Atomic Design, TypeScript, Clean Code)

Bagus — saya susun analisis, keputusan desain, dan langkah implementasi terperinci supaya `packages/ag-ui/*` berubah menjadi sistem komponen Atomic Design yang konsisten, teruji, dan mudah dimigrasikan ke semua branch.

---

# 1) Hasil yang diinginkan (high level)

* Struktur komponen tersusun sesuai Atomic Design (Atoms → Molecules → Organisms → Templates → Pages).
* API/props konsisten (TypeScript interfaces + forwardRef + pola polymorphic bila perlu).
* Theming berbasis design tokens (dapat diubah untuk multi-tenant).
* Storybook lengkap untuk setiap komponen (docs + controls + accessibility panel).
* Unit & integration tests (Jest + React Testing Library + axe).
* Performa dioptimalkan (memoization, lazy loading, code-splitting).
* Strategi migrasi bertahap untuk semua branch + PR + CI checks.

---

# 2) Struktur direktori yang disarankan

Ganti `components/` flat menjadi struktur Atomic Design:

```
packages/ag-ui/src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── Avatar/
│   │   └── Badge/
│   ├── molecules/
│   │   ├── Card/
│   │   └── StatsCard/
│   ├── organisms/
│   │   ├── ActivityFeed/
│   │   └── NotificationCenter/
│   ├── templates/
│   │   └── DashboardLayout/
│   ├── utils/
│   │   └── index.ts
│   └── index.ts                 # barrel file: export per atomic group
├── theme/
│   ├── tokens.json              # design tokens
│   ├── ThemeProvider.tsx
│   └── useTheme.ts
├── stories/                     # global storybook configs & playgrounds
└── index.tsx
```

Catatan: setiap komponen folder mengandung:

* komponen inti (`.tsx`)
* tipe props (`.types.ts`)
* storybook (`.stories.tsx`)
* unit test (`.test.tsx`)
* (opsional) styles modul / style system file.

---

# 3) Standarisasi Props & pola TypeScript

Buat pola props konsisten untuk semua atoms:

Contoh `Button.types.ts`:

```ts
import React from "react";

export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface BaseProps {
  className?: string;
  "data-testid"?: string;
  style?: React.CSSProperties;
  id?: string;
}

export interface ButtonProps extends BaseProps {
  children?: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
```

Pattern rekomendasi:

* Semua komponen menggunakan `forwardRef`.
* Gunakan `export type` untuk props, bukan `any`.
* Sertakan `data-testid` pada semua components untuk testability.
* Pisahkan presentational props (size, variant) dari behavioral props (onClick, value).
* Jika perlu polymorphic components, gunakan generic `as` prop pattern (satu pola tersendiri).

---

# 4) Status Implementasi Saat Ini (Per 2026-01-06)

## ✅ Selesai
1. **Audit & Strukturisasi**: Komponen telah dipindahkan dari struktur flat ke struktur Atomic Design:
   - `src/components/atoms/`: Avatar, Badge, Button, Input, Logo, Skeleton.
   - `src/components/molecules/`: Card, EmptyState, StatsCard.
   - `src/components/organisms/`: ActivityFeed, AiAssistantPanel, CollaborativeEditor, DocumentViewer, Modal, NotificationCenter, TemplateEditor.
   - `src/components/templates/`: DashboardTemplate.
2. **Barrel Exports**: Menambahkan `index.ts` di setiap folder atomic dan `src/components/index.ts` untuk mempermudah import.
3. **Refactoring Dasar**:
   - Memperbaiki relative imports di semua komponen yang dipindahkan.
   - Menstandarisasi penamaan (misal: `DashboardLayout` -> `DashboardTemplate`).
   - Menstandarisasi typing dengan TypeScript interfaces (extending React/Framer Motion props).
   - Mengimplementasikan `forwardRef` dan `cn` utility untuk class merging di semua komponen utama.
4. **Design Guidelines**: Membuat [DESIGN_GUIDELINES.md](file:///home/inbox/smart-ai/lawyers-hub/packages/ag-ui/DESIGN_GUIDELINES.md) sebagai panduan pengembangan.
5. **Testing Framework Setup**:
   - Mengonfigurasi Jest dan React Testing Library.
   - Menyiapkan `jest.config.js` dan `jest.setup.ts`.
   - Menambahkan unit test pertama untuk `Button.tsx`.
6. **Storybook Integration**:
   - Mengonfigurasi Storybook v8 dengan Vite.
   - Menambahkan stories untuk `Button`, `Input`, dan `Card`.

## 🔄 Sedang Berjalan
1. **Unit Testing**: Membuat test suite untuk komponen level Atoms lainnya (Input, Badge, etc.).
2. **Theming System**: Implementasi design tokens dan ThemeProvider.

## 📋 Proyeksi Selanjutnya
1. **Migrasi Consumer**: Update aplikasi (apps/web) untuk menggunakan path import baru.
2. **CI/CD Pipeline**: Menyiapkan pipeline untuk pengujian otomatis dan Storybook build.
3. **Audit Aksesibilitas**: Menggunakan `jest-axe` untuk memastikan semua komponen memenuhi standar WAI-ARIA.

---

# 5) Contoh implementasi komponen atom (Button) — clean & performant

```tsx
// Button.tsx
import React from "react";
import cn from "classnames";
import { ButtonProps } from "./Button.types";

const base = "inline-flex items-center justify-center rounded focus:outline-none focus:ring";

function sizeClass(size: string) {
  switch (size) {
    case "sm": return "px-3 py-1.5 text-sm";
    case "lg": return "px-5 py-3 text-lg";
    default: return "px-4 py-2 text-base";
  }
}

export const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, className, size = "md", variant = "primary", disabled, ...rest }, ref) {
    const classes = cn(base, sizeClass(size), className, {
      "opacity-50 cursor-not-allowed": disabled,
      "bg-blue-600 text-white": variant === "primary",
      "bg-transparent border": variant === "ghost",
    });

    return (
      <button ref={ref} className={classes} disabled={disabled} {...rest}>
        {children}
      </button>
    );
  }
));
Button.displayName = "Button";
```

— menggunakan `React.memo` + `forwardRef`. (Sesuaikan class utilities dengan design system; contoh pakai Tailwind-esque utility.)

---

# 5) Theming & Design Tokens (multi-tenant ready)

* Simpan design tokens sebagai JSON (`theme/tokens.json`) berisi warna, spacing, typography, radii.
* `ThemeProvider` meng-inject CSS variables ke root container (inline style) sehingga tenant bisa ganti tokens di runtime.
* Expose `useTheme()` hook untuk komponen mengkonsumsi tokens (jika butuh values di JS).

Contoh tokens.json:

```json
{
  "colors": {
    "primary": "#0066FF",
    "primary-700": "#0051cc",
    "background": "#ffffff",
    "surface": "#f7f8fa",
    "text": "#111827"
  },
  "radius": { "sm": 4, "md": 8, "lg": 12 },
  "spacing": { "1": 4, "2": 8, "3": 12, "4": 16 }
}
```

`ThemeProvider.tsx` memberikan:

* mekanisme `setTheme(tenantTheme)` untuk runtime override,
* fallback ke default tokens,
* SSR-friendly (inject ke `<style>` di server-side render).

---

# 6) Storybook & Dokumentasi

* Konfigurasi dasar Storybook (v7 recommended) di package level.
* Aturan: setiap komponen punya file `*.stories.tsx` dengan:

  * Docs page (MDX) menjelaskan props, states, accessibility notes.
  * Controls untuk `variant`, `size`.
  * Visual regression: tambahkan Chromatic/Storybook Snapshot step pada CI.
* Tambahkan addon:

  * `@storybook/addon-essentials`
  * `@storybook/addon-a11y`
  * `@storybook/addon-interactions`
* Example story (Button.stories.tsx) yang memanfaatkan `args`.

---

# 7) Testing & Accessibility

* Unit tests: Jest + RTL. Struktur test per komponen.
* Integration tests: testing-library + msw (mock request) untuk components yang berinteraksi dengan network (e.g., CollaborativeEditor).
* Accessibility: configure `jest-axe` in unit tests, run `axe` in Storybook with addon-a11y. Add `eslint-plugin-jsx-a11y` to lint rules.
* Coverage target: 90% for atoms, 80% for molecules/organisms initially.

Contoh unit test:

```ts
// Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { Button } from "./Button";

test("renders button and fires onClick", () => {
  const handle = jest.fn();
  render(<Button onClick={handle}>Click</Button>);
  fireEvent.click(screen.getByText("Click"));
  expect(handle).toHaveBeenCalled();
});

test("a11y check", async () => {
  const { container } = render(<Button>Accessible</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

---

# 8) Performance optimizations

* Atoms: keep minimal rendering logic; memoize via `React.memo`.
* Molecules/Organisms: memoize expensive derived computations with `useMemo`.
* Use `React.lazy()` + `Suspense` untuk organisms / heavy libs (e.g., CollaborativeEditor, DocumentViewer).
* Avoid anonymous functions inline; prefer `useCallback` when passing to children.
* Prefer CSS for animations over JS.
* Tree-shakeable exports: use per-component entry points; avoid big default export that pulls whole library.

Example lazy-load usage:

```tsx
const CollaborativeEditor = React.lazy(() => import("../organisms/CollaborativeEditor/CollaborativeEditor"));
```

---

# 9) Barrels & Exports

`components/index.ts`:

```ts
export * from "./atoms/Button/Button";
export * from "./atoms/Input/Input";
// groups
export * from "./molecules/Card";
```

Top-level package `index.ts` eksport hanya yang stable. Jangan expose internals.

---

# 10) Quality Gates / CI

Set pipeline per PR:

1. `pnpm install` (or yarn)
2. `pnpm lint` (ESLint + plugin jsx-a11y + TS rules)
3. `pnpm type-check`
4. `pnpm test --coverage` (fail if coverage drops below threshold)
5. `pnpm build` (bundle and storybook build)
6. `pnpm storybook:ci` (optionally screenshot tests)
7. `pnpm axe-ci` / accessibility audit step
8. Code owners + mandatory reviewers for `packages/ag-ui/**`

Tambahkan GH Action template untuk package-level CI.

---

# 11) Strategi Migrasi branch-by-branch (practical)

1. **Prepare migration branch**: buat `ag-ui/atomic-reorg` branch di repo.
2. **Create codemod mapping**: jscodeshift script untuk mengubah import paths dari `components/Button` → `atoms/Button`.
3. **Move atoms first**: migrasi atoms (Button, Input, Badge, Avatar) ke folder baru + tests + stories. Bump package minor version.
4. **Backwards compatibility layer**: sediakan compat barrel files (temporary) yang re-export dari new locations to old paths to avoid mass breakage:

   ```ts
   // components/Button.tsx (compat)
   export * from "./atoms/Button/Button";
   ```

   Mark as deprecated in comments.
5. **Migrate molecules**: after atoms stable and tests pass, migrate molecules, update molecules to use new atom exports.
6. **Migrate organisms & templates**: progressively, using feature flags or staging env.
7. **Remove compat files**: when all branches updated, remove compat layer in single major bump.
8. **Branch coordination**: create PR checklist and require:

   * `storybook` passes
   * unit & integration tests pass
   * accessibility checks pass
9. **Automated PR creation**: use scripts to create PRs across branches if repo uses many branches; otherwise coordinate through release manager.

---

# 12) PR / Code Review Checklist (include in PR template)

* [ ] Type definitions exist for changed components.
* [ ] `forwardRef` used where appropriate.
* [ ] No console logs or debug artifacts.
* [ ] Storybook story added/updated.
* [ ] Unit tests added/updated; coverage unchanged or improved.
* [ ] Accessibility checks performed (aria, roles).
* [ ] CI green: lint, typecheck, test, storybook build.
* [ ] If breaking changes — include migration notes & codemod.

---

# 13) Measurables & Targets

* Reusability target: up to **80%** reuse for UI across app (tracking via import graph).
* Unit test coverage: Atoms ≥ 90%, Molecules ≥ 80%, Organisms ≥ 70%.
* Storybook coverage: 100% atoms, 90% molecules.
* Accessibility: 0 critical axe violations on CI; fix violations within PR.

---

# 14) Tools / Libraries rekomendasi

* Styling: Stitches / Emotion / Tailwind (pilih 1, prefer CSS variables + utility-first if you already use Tailwind).
* Component testing: Jest + React Testing Library + jest-axe.
* Runtime theming: CSS variables + ThemeProvider (library-agnostic).
* Build & bundler: Vite / tsup for packages (tergantung monorepo).
* Codemod: jscodeshift untuk migrasi import path.
* Storybook v7 + addon-a11y + interactions.

---

# 15) Contoh Task-level checklist (implementasi iterasi 1 — atoms)

1. Buat folder `atoms/{Button,Input,Avatar,Badge}`.
2. Implement Button/Props/Stories/Tests (lihat contoh di atas).
3. Tambah `ThemeProvider` skeleton & `tokens.json`.
4. Setup Storybook & run `pnpm storybook`.
5. Tambah GH Action CI untuk `packages/ag-ui`.
6. Run codemod mapping imports (dry-run) lalu create PR.

---

# 16) Risks & mitigasi

* **Breaking changes import path**: mitigasi dengan compat barrels & codemods.
* **Performance regressions**: profil sebelum/ sesudah; lazy load heavy components.
* **Design drift (non-uniform styles)**: paksa design tokens + storybook as source-of-truth.
* **Accessibility debt**: enforce axe in CI.

---

# 17) Deliverables yang akan Anda dapatkan (konkrit)

* Struktur direktori terorganisir (atoms/molecules/organisms/templates).
* Satu “reference” atom (Button) fully implemented: code + story + test + a11y.
* Theme provider + tokens.json + usage doc.
* CI checklist + PR template sample.
* Migration plan & jscodeshift codemod example.
* QA checklist (unit, integration, a11y).

---

# 18) Contoh jscodeshift transform (sederhana)

```js
// transform.js (jscodeshift)
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  return j(fileInfo.source)
    .find(j.ImportDeclaration)
    .replaceWith(path => {
      const source = path.node.source.value;
      if (source === "packages/ag-ui/src/components/Button") {
        path.node.source.value = "packages/ag-ui/src/components/atoms/Button/Button";
      }
      return path.node;
    })
    .toSource();
};
```

Jalankan dry-run dahulu: `jscodeshift -t transform.js src --dry`

---

# 19) Next steps konkret (apa yang bisa langsung diambil oleh tim)

1. **Implementasi Button atom** sesuai contoh di branch `ag-ui/atomic-atoms`.
2. **Setup Storybook** dan publish storybook build ke static hosting (netlify / vercel) untuk review.
3. **Create CI pipeline** minimal untuk `packages/ag-ui`.
4. **Run codemod** dry-run di branch dev.
5. **Start migrating Input, Badge, Avatar** (sprint 1).
