# Governance - Conflict Resolution Logic
ID: G-11-B | Category: Management | Version: 1.1.0 | Last_Updated: 2026-01-07

## Conflict Resolution Workflow
1. Analisis perubahan rule baru terhadap rule yang sudah ada di folder `core/`, `specialists/`, dan `governance/`.
2. Jika ditemukan konflik, berikan rekomendasi penggabungan atau pemisahan konten lebih lanjut.
3. Tandai rule yang bermasalah di dalam `system.log`.

## Audit Workflow
- Jalankan `Grep` pada instruksi kunci untuk mendeteksi redundansi.
- Validasi batasan 1000 karakter tetap terjaga.
