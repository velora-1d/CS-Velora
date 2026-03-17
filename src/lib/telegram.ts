export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram configuration is missing. Notification not sent.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to send Telegram notification:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}
