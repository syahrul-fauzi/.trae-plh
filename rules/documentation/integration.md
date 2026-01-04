# Panduan Integrasi Agentic Rules

## 1. Overview
Sistem Agentic Rules di Lawyers Hub bertindak sebagai middleware antara AI Agent dan eksekusi tindakan (tools). Setiap agent wajib memvalidasi tindakannya melalui `RuntimeEnforcer` sebelum melanjutkan.

## 2. Cara Menggunakan

### Instalasi Engine
Pastikan modul `enforcement/runtime_enforcer.ts` sudah terintegrasi dalam pipeline eksekusi agent Anda.

### Contoh Implementasi (TypeScript)
```typescript
import { RuntimeEnforcer } from '../.trae/rules/enforcement/runtime_enforcer';

const enforcer = new RuntimeEnforcer();

async function handleAgentRequest(request) {
    const action = {
        agentId: 'research_agent_01',
        actionType: 'database_query',
        payload: { query: 'SELECT * FROM clients' },
        context: 'jurisprudence_research'
    };

    const result = await enforcer.evaluateAction(action);

    if (result.status === 'BLOCK') {
        return `Aksi diblokir: ${result.message}`;
    } else if (result.status === 'ESCALATE') {
        return `Aksi memerlukan review manusia: ${result.message}`;
    }

    // Lanjutkan eksekusi jika status === 'ALLOW'
    return executeAction(action);
}
```

## 3. Konvensi Penamaan Aturan
- **Global**: `GBL-[CATEGORY]-[NUMBER]`
- **Domain**: `DOM-[DOMAIN_CODE]-[NUMBER]`
- **Agent**: `AGT-[AGENT_TYPE]-[NUMBER]`

## 4. Alur Pembaruan Aturan
1. Tambahkan file YAML baru di folder `domains/` atau `core/`.
2. Jalankan skrip validasi (jika tersedia).
3. Lakukan Pull Request dengan label `legal-review`.
4. Setelah di-merge, engine akan otomatis memuat aturan baru (jika mendukung hot-reloading).
