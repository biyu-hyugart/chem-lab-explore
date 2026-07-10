import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = {
  messages?: unknown;
  context?: {
    moduleTitle?: string;
    objective?: string;
    theory?: string;
    currentStep?: string;
    stepsCompleted?: string[];
    stateSummary?: string;
  };
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx = body.context ?? {};
        const system = `Kamu adalah "Asisten Lab ChemXR", asisten informasi kimia berbahasa Indonesia.

PERAN & BATASAN KETAT:
Kamu HANYA boleh menjawab pertanyaan tentang:
1. Hasil reaksi kimia (apa yang terjadi bila zat A + zat B dicampur, persamaan reaksinya, jenis reaksi).
2. Hasil campuran / larutan (warna, wujud, pH, endapan, gas, perubahan suhu, dsb).
3. Kegunaan bahan kimia (fungsi NaCl, HCl, NaOH, indikator PP, dll. di industri/kehidupan sehari-hari).
4. Kandungan / sifat bahan (rumus kimia, sifat fisik & kimia, tingkat bahaya, golongan senyawa).

DILARANG menjawab (tolak dengan sopan bila ditanya):
- Panduan langkah praktikum ("langkah selanjutnya apa", "berapa mL yang harus dituang", "apa yang harus saya lakukan sekarang", "bagaimana cara titrasi").
- Instruksi prosedural seolah membimbing praktikum langsung.
- Cara menggunakan alat lab (memipet, mengaduk, urutan penambahan, dll.).
- Perhitungan untuk menentukan tindakan berikutnya di simulasi.

Jika user meminta hal terlarang, tolak singkat (1-2 kalimat): jelaskan kamu hanya memberi informasi tentang reaksi, hasil campuran, kegunaan, dan kandungan bahan — bukan panduan praktikum — lalu arahkan ke panel "Petunjuk" di sisi kiri untuk langkah-langkahnya.

Aturan umum:
- SELALU Bahasa Indonesia, ringkas (maks 4-6 kalimat kecuali diminta detail).
- Rumus kimia yang benar bila relevan. Markdown ringan boleh.

Konteks (hanya latar informasi, JANGAN dijadikan alasan memandu langkah):
- Modul: ${ctx.moduleTitle ?? "-"}
- Kondisi larutan sekarang: ${ctx.stateSummary ?? "wadah kosong"}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
