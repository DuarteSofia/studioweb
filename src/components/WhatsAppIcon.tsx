import { siWhatsapp } from 'simple-icons/icons';

interface WhatsAppIconProps {
  size?: number;
  className?: string;
  /** Override the fill color. Defaults to the official WhatsApp green (#25D366). */
  color?: string;
}

/**
 * Official WhatsApp brand icon from Simple Icons.
 * Uses siWhatsapp.path and siWhatsapp.hex for the authentic SVG and color.
 */
export default function WhatsAppIcon({
  size = 16,
  className,
  color,
}: WhatsAppIconProps) {
  const fill = color ?? `#${siWhatsapp.hex}`;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      className={className}
      aria-label="WhatsApp"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={siWhatsapp.path} />
    </svg>
  );
}
