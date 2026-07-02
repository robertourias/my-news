import cron from "node-cron";
import { generateBriefing, getLatestBriefing } from "@/lib/briefing";
import { todayISO } from "@/lib/date";

export async function registerNode() {
  const schedule = process.env.CRON_SCHEDULE || "0 6 * * *";
  const timezone = process.env.TZ || "America/Sao_Paulo";

  cron.schedule(
    schedule,
    () => {
      console.log("[cron] gerando briefing diário…");
      generateBriefing().catch((err) => console.error("[cron] falha:", err));
    },
    { timezone }
  );
  console.log(`[cron] agendado: "${schedule}" (${timezone})`);

  if ((process.env.AUTO_GENERATE_ON_BOOT ?? "true") !== "false") {
    setTimeout(async () => {
      try {
        const latest = await getLatestBriefing();
        if (!latest || latest.date !== todayISO()) {
          console.log("[boot] briefing do dia ausente — gerando…");
          await generateBriefing();
        }
      } catch (err) {
        console.error("[boot] falha na geração inicial:", err);
      }
    }, 3000);
  }
}
