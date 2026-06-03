interface WhatsAppMessageInput {
  phone: string;
  title: string;
  message: string;
  deepLink?: string;
}

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const graphVersion = process.env.WHATSAPP_GRAPH_VERSION ?? "v20.0";
const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "91";

function formatWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
}

export async function sendWhatsAppMessage(input: WhatsAppMessageInput) {
  if (!accessToken || !phoneNumberId) {
    return { ok: false, skipped: true, reason: "WhatsApp credentials are not configured." };
  }

  const to = formatWhatsAppPhone(input.phone);
  if (!to) {
    return { ok: false, skipped: true, reason: "Phone number is missing." };
  }

  const body = [input.title, "", input.message, input.deepLink ? `Open: ${input.deepLink}` : ""]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
        preview_url: Boolean(input.deepLink)
      }
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return { ok: false, skipped: false, error: data };
  }

  return { ok: true, skipped: false };
}

export async function sendWhatsAppBroadcast(phones: string[], input: Omit<WhatsAppMessageInput, "phone">) {
  const uniquePhones = [...new Set(phones.map(formatWhatsAppPhone).filter(Boolean))];
  return Promise.allSettled(
    uniquePhones.map((phone) =>
      sendWhatsAppMessage({
        ...input,
        phone
      })
    )
  );
}
