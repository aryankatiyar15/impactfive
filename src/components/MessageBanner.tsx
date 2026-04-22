import type { Message } from "@/lib/types";

type MessageBannerProps = {
  message: Message | null;
};

export function MessageBanner({ message }: MessageBannerProps) {
  if (!message) {
    return null;
  }

  const tone =
    message.type === "error"
      ? "border-coral bg-[#fff7f4]"
      : message.type === "success"
        ? "border-mint bg-[#f1faf6]"
        : "border-gold bg-[#fffaf0]";

  return (
    <div className={`rounded-[8px] border p-3 text-sm text-ink ${tone}`}>
      {message.text}
    </div>
  );
}
