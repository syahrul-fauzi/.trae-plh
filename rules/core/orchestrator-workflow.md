# Core - Orchestrator Workflow
ID: C-00-B | Category: Core | Version: 1.3.0 | Last_Updated: 2026-01-07

## Workflow Execution
1. **Analyze**: Identifikasi kategori agen yang relevan (Core, Specialist, Management).
2. **Plan**: Buat daftar tugas di `TodoWrite`.
3. **Execute**: Terapkan perubahan sesuai aturan agen terkait dengan `Write` atau `SearchReplace`.
4. **Audit**: Jalankan validator dan detektor konflik (Agen 10 & 11) di folder `governance/`.
5. **Sync**: Pastikan perubahan tersinkronisasi dengan repositori utama.

## Verification Checklist
- [ ] Apakah semua agen relevan telah dilibatkan?
- [ ] Apakah `GetDiagnostics` menunjukkan hasil bersih?
- [ ] Apakah `system.log` telah diperbarui?
