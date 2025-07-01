
import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Country {
  code: string
  country: string
  name: string
  flag: string
  placeholder: string
}

const countries: Country[] = [
  { code: "+55", country: "BR", name: "Brasil", flag: "🇧🇷", placeholder: "(11) 99999-9999" },
  { code: "+54", country: "AR", name: "Argentina", flag: "🇦🇷", placeholder: "(11) 1234-5678" },
  { code: "+56", country: "CL", name: "Chile", flag: "🇨🇱", placeholder: "(2) 1234 5678" },
  { code: "+57", country: "CO", name: "Colômbia", flag: "🇨🇴", placeholder: "(1) 234 5678" },
  { code: "+34", country: "ES", name: "Espanha", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { code: "+1", country: "US", name: "Estados Unidos", flag: "🇺🇸", placeholder: "(555) 123-4567" },
  { code: "+52", country: "MX", name: "México", flag: "🇲🇽", placeholder: "55 1234 5678" },
  { code: "+351", country: "PT", name: "Portugal", flag: "🇵🇹", placeholder: "912 345 678" },
]

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [countryCode, setCountryCode] = React.useState("+55")
    const [phoneNumber, setPhoneNumber] = React.useState("")

    // Parse initial value if provided
    React.useEffect(() => {
      if (value && value !== `${countryCode}${phoneNumber}`) {
        const country = countries.find(c => value.startsWith(c.code))
        if (country) {
          setCountryCode(country.code)
          setPhoneNumber(value.substring(country.code.length))
        } else {
          setPhoneNumber(value)
        }
      }
    }, [value])

    const selectedCountry = countries.find(c => c.code === countryCode) || countries[0]

    const handleCountryChange = (newCountryCode: string) => {
      setCountryCode(newCountryCode)
      const fullNumber = `${newCountryCode}${phoneNumber}`
      onChange?.(fullNumber)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPhoneNumber = e.target.value
      setPhoneNumber(newPhoneNumber)
      const fullNumber = `${countryCode}${newPhoneNumber}`
      onChange?.(fullNumber)
    }

    return (
      <div className={cn("flex gap-2", className)}>
        <Select value={countryCode} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[120px] border-[#DEDEDE] focus:border-[#61710C]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <span className="text-sm text-[#64748B]">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          {...props}
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={selectedCountry.placeholder}
          className="flex-1 border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-50"
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
