/**
 * Pure utility: build a WhatsApp URL from a design and site config.
 * No side effects, no store reads — just string building.
 */
export function buildWhatsAppUrl(
  design: {
    name: string;
    whatsappNumberOverride?: string;
    whatsappMessageOverride?: string;
  },
  config?: {
    whatsappNumber?: string;
    whatsappMessage?: string;
  } | null
): string {
  const DEFAULT_NUMBER = '5491112345678';
  const DEFAULT_MESSAGE =
    'Hola, me interesa el diseño web: {{design_name}}. ¿Podrías darme más información?';

  const number =
    design.whatsappNumberOverride ||
    config?.whatsappNumber ||
    DEFAULT_NUMBER;

  const messageTemplate =
    design.whatsappMessageOverride ||
    config?.whatsappMessage ||
    DEFAULT_MESSAGE;

  const message = messageTemplate.replace(/\{\{design_name\}\}/g, design.name);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
