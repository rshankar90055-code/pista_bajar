import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin";
import { readStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase-config";

export async function GET() {
  const checks = {
    adminPassword: Boolean(getAdminPassword()),
    msg91AuthKey: Boolean(process.env.MSG91_AUTH_KEY),
    msg91TemplateId: Boolean(process.env.MSG91_TEMPLATE_ID),
    upiId: Boolean(process.env.NEXT_PUBLIC_PISTABAJAAR_UPI_ID),
    storage: false
  };
  const optionalChecks = {
    whatsappAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    whatsappPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    supabase: isSupabaseConfigured()
  };

  try {
    await readStore();
    checks.storage = true;
  } catch {
    checks.storage = false;
  }

  const missing = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return NextResponse.json({
    ok: missing.length === 0,
    checks,
    optionalChecks,
    missing,
    requiredEnv: ["ADMIN_PASSWORD", "MSG91_AUTH_KEY", "MSG91_TEMPLATE_ID", "NEXT_PUBLIC_PISTABAJAAR_UPI_ID"],
    optionalEnv: [
      "MSG91_COUNTRY_CODE",
      "MSG91_OTP_LENGTH",
      "MSG91_OTP_EXPIRY_MINUTES",
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_GRAPH_VERSION",
      "WHATSAPP_DEFAULT_COUNTRY_CODE",
      "NEXT_PUBLIC_NOTIFICATION_ICON",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY"
    ]
  });
}
