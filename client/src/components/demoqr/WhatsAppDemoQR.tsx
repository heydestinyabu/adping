import { QRCodeCanvas } from "qrcode.react";

export function WhatsAppDemoQR({
  phone,
  message = "Hello, I want a demo",
}: {
  phone: string;
  message?: string;
}) {
  const encodedMessage = encodeURIComponent(message);
  const waLink = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <div className="flex flex-col items-center gap-3 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Scan to Send WhatsApp Demo Message</h3>

      <QRCodeCanvas value={waLink} size={180} />

      <p className="text-sm text-gray-600 text-center">
        Scan this QR to chat on WhatsApp
      </p>

      <a
        href={waLink}
        target="_blank"
        className="text-blue-600 underline text-sm mt-2"
      >
        Or click here to open WhatsApp
      </a>
    </div>
  );
}
