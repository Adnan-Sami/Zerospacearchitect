import { Input } from "@/components/ui/input";
import { isValidPhone, normalizePhone } from "@/lib/phone-auth";

export const normalizeBdLocalPhone = normalizePhone;
export const isValidBdLocalPhone = isValidPhone;

type BdPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputClassName?: string;
};

export function BdPhoneInput({
  value,
  onChange,
  required = true,
  inputClassName = "",
}: BdPhoneInputProps) {
  return (
    <div className="mt-1.5 flex h-12 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
      <div className="flex shrink-0 items-center gap-2 border-r bg-gray-50 px-3 text-sm font-semibold text-gray-700">
        <svg
          width="22"
          height="15"
          viewBox="0 0 22 15"
          className="shrink-0 rounded-sm"
          aria-hidden="true"
        >
          <rect width="22" height="15" fill="#006a4e" />
          <circle cx="10" cy="7.5" r="4" fill="#f42a41" />
        </svg>
        <span>+88</span>
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        onChange={(event) => onChange(normalizePhone(event.target.value))}
        placeholder="01XXXXXXXXX"
        required={required}
        minLength={11}
        maxLength={11}
        pattern="01[0-9]{9}"
        title="+88 এর পরে ১১ ডিজিটের বাংলাদেশি ফোন নম্বর দিন"
        className={`h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 ${inputClassName}`}
      />
    </div>
  );
}
