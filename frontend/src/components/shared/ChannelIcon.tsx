import { Mail, MessageCircle, Phone, Zap } from 'lucide-react';

interface ChannelIconProps {
  channel: string;
}

const channelConfig: Record<
  string,
  { icon: typeof MessageCircle; label: string; color: string }
> = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600' },
  sms: { icon: Phone, label: 'SMS', color: 'text-blue-600' },
  email: { icon: Mail, label: 'Email', color: 'text-purple-600' },
  rcs: { icon: Zap, label: 'RCS', color: 'text-orange-600' },
};

export default function ChannelIcon({ channel }: ChannelIconProps) {
  const normalizedChannel = String(channel ?? '').toLowerCase();
  const config = channelConfig[normalizedChannel] ?? {
    icon: MessageCircle,
    label: channel || 'Channel',
    color: 'text-slate-600',
  };
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className="text-sm">{config.label}</span>
    </span>
  );
}
