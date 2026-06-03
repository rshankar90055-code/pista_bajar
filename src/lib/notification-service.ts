import { addNotification, readStore } from "@/lib/store";
import type { AppNotification } from "@/lib/types";
import { sendWhatsAppBroadcast } from "@/lib/whatsapp-service";

interface NotifyUsersInput {
  title: string;
  message: string;
  type: AppNotification["type"];
  icon?: string;
  deepLink?: string;
}

const defaultIcon = process.env.NEXT_PUBLIC_NOTIFICATION_ICON ?? "/pistabajaar-logo.png";

export async function notifyUsers(input: NotifyUsersInput) {
  const notification = await addNotification({
    audience: "user",
    title: input.title,
    message: input.message,
    type: input.type,
    icon: input.icon ?? defaultIcon,
    deepLink: input.deepLink ?? "/"
  });

  await sendWhatsAppToUsers({
    title: notification.title,
    message: notification.message,
    deepLink: notification.deepLink ?? "/"
  });

  return notification;
}

async function sendWhatsAppToUsers(payload: { title: string; message: string; deepLink: string }) {
  const store = await readStore();
  await sendWhatsAppBroadcast(
    store.users.filter((user) => user.otpVerified).map((user) => user.phone),
    payload
  );
}
