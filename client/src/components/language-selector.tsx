import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSelector() {
  const { language, setLanguage, languages, fetchEnabledLanguages } = useTranslation();

  useEffect(() => {
    fetchEnabledLanguages();
  }, []);

  const currentConfig = languages[language];

  return (
    <Select value={language} onValueChange={(value: any) => setLanguage(value, true)}>
      <SelectTrigger className="w-[110px]" data-testid="select-language">
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none">{currentConfig?.flag}</span>
          <span>{currentConfig?.nativeName}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, config]) => (
          <SelectItem
            key={code}
            value={code}
            data-testid={`option-language-${code}`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{config.flag}</span>
              <span>{config.nativeName}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
