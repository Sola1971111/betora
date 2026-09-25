import { useState } from 'react';
import { teamInitials, teamColor } from '../data/mockData';

interface TeamCrestProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
}

export default function TeamCrest({ name, logoUrl, size = 20 }: TeamCrestProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="inline-block rounded-full object-contain flex-shrink-0 bg-white"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
        loading="lazy"
      />
    );
  }

  const color = teamColor(name);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.max(8, size * 0.4),
      }}
    >
      {teamInitials(name)}
    </span>
  );
}
