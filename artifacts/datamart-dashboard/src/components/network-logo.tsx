import type { NetworkId } from "@/pages/buy";

interface NetworkLogoProps {
  network: NetworkId;
  size?: number;
  className?: string;
}

export function NetworkLogo({ network, size = 56, className = "" }: NetworkLogoProps) {
  if (network === "YELLO") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="56" height="56" rx="12" fill="#FFCC00" />
        <text
          x="28"
          y="36"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontSize="18"
          fill="#1a1a1a"
          letterSpacing="-0.5"
        >
          MTN
        </text>
      </svg>
    );
  }

  if (network === "TELECEL") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="56" height="56" rx="12" fill="#E60000" />
        <text
          x="28"
          y="27"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontSize="11"
          fill="white"
        >
          Telecel
        </text>
        <text
          x="28"
          y="40"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          fontSize="9"
          fill="rgba(255,255,255,0.75)"
        >
          Ghana
        </text>
      </svg>
    );
  }

  if (network === "AT_PREMIUM") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="56" height="56" rx="12" fill="#0033A0" />
        <text
          x="28"
          y="27"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="white"
        >
          AT
        </text>
        <text
          x="28"
          y="40"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
          fontSize="8"
          fill="rgba(255,255,255,0.8)"
          letterSpacing="1"
        >
          PREMIUM
        </text>
      </svg>
    );
  }

  // "at" — AirtelTigo
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="28" height="56" rx="0" fill="#EF3D42" />
      <rect x="28" width="28" height="56" rx="0" fill="#0033A0" />
      <rect width="56" height="56" rx="12" fill="url(#at-grad)" />
      <defs>
        <linearGradient id="at-grad" x1="0" y1="0" x2="56" y2="0">
          <stop offset="0%" stopColor="#EF3D42" />
          <stop offset="50%" stopColor="#C0302F" />
          <stop offset="100%" stopColor="#0033A0" />
        </linearGradient>
      </defs>
      <text
        x="28"
        y="27"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="white"
      >
        Airtel
      </text>
      <text
        x="28"
        y="40"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="11"
        fill="rgba(255,255,255,0.9)"
      >
        Tigo
      </text>
    </svg>
  );
}
