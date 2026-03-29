import { Checkbox, Label } from '@/lib/shadcn/ui';

interface AudioTrackRowProps {
  field: string;
  label: string;
  checked: boolean;
  onToggle: (field: string) => void;
}

export default function AudioTrackRow({ field, label, checked, onToggle }: AudioTrackRowProps) {
  return (
    <div className="flex items-center gap-2 min-h-[44px]">
      <Checkbox id={field} checked={checked} onCheckedChange={() => onToggle(field)} />
      <Label htmlFor={field} className="text-sm cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
