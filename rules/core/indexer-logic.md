# Core - Indexing Logic
ID: C-09-B | Category: Core | Version: 1.2.0 | Last_Updated: 2026-01-07

## Automatic Indexing Logic
Setiap kali ada perubahan file:
1. Perbarui `README.md` di `.trae/rules/`.
2. Verifikasi link `file:///` di seluruh dokumen.
3. Audit ukuran file agar tetap ≤ 1000 karakter.

## Verification Checklist
- [ ] Apakah `README.md` mencakup folder baru?
- [ ] Apakah link antar rule valid?
- [ ] Apakah ada file > 1000 karakter?
