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
        const system = `Kamu adalah "Asisten Lab ChemXR", asisten kimia virtual berbahasa Indonesia yang ramah, sabar, dan aman. Kamu membantu mahasiswa/pelajar menjalankan praktikum virtual satu per satu langkah.

Aturan wajib:
- Jawaban SELALU dalam Bahasa Indonesia yang jelas dan singkat (maks 4-6 kalimat kecuali diminta detail).
- Pandu langkah demi langkah. Jangan langsung membocorkan seluruh jawaban; beri petunjuk dahulu.
- Ingatkan aspek keselamatan (mis. tambahkan asam ke air, bukan sebaliknya).
- Kalau pengguna melakukan kesalahan, jelaskan mengapa salah dan sarankan langkah perbaikan.
- Gunakan rumus kimia yang benar (M = n/V, M1V1 = M2V2, mol asam = mol basa pada titik ekivalen, dll.).
- Boleh memakai format markdown ringan (list, **bold**).

Konteks praktikum saat ini:
- Modul: ${ctx.moduleTitle ?? "-"}
- Tujuan: ${ctx.objective ?? "-"}
- Teori singkat: ${ctx.theory ?? "-"}
- Langkah yang sedang dikerjakan: ${ctx.currentStep ?? "-"}
- Langkah sudah selesai: ${ctx.stepsCompleted?.join(", ") || "belum ada"}
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
