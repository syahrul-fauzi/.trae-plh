# Core - User Guide
ID: C-UG-01 | Category: Core | Version: 1.0.0 | Last_Updated: 2026-01-07

## Panduan Operasional

### Menambahkan Rule Baru
1. Gunakan folder yang sesuai (`core/`, `specialists/`, `governance/`).
2. Gunakan naming `[slug].md`.
3. Metadata WAJIB di header.
4. Ukuran MAKSIMAL 1000 karakter.

### Melacak Perubahan
Setiap modifikasi rule wajib dicatat di `system.log`.

### Keamanan & Rollback
Sistem mempertahankan *backward compatibility*. Gunakan snapshot di `system.log` jika perlu rollback.
