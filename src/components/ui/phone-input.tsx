
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
  maxLength: number
}

const countries: Country[] = [
  { code: "+55", country: "BR", name: "Brasil", flag: "🇧🇷", placeholder: "(11) 99999-9999", maxLength: 11 },
  { code: "+54", country: "AR", name: "Argentina", flag: "🇦🇷", placeholder: "(11) 1234-5678", maxLength: 10 },
  { code: "+56", country: "CL", name: "Chile", flag: "🇨🇱", placeholder: "(2) 1234 5678", maxLength: 9 },
  { code: "+57", country: "CO", name: "Colômbia", flag: "🇨🇴", placeholder: "(1) 234 5678", maxLength: 10 },
  { code: "+34", country: "ES", name: "Espanha", flag: "🇪🇸", placeholder: "612 34 56 78", maxLength: 9 },
  { code: "+1", country: "US", name: "Estados Unidos", flag: "🇺🇸", placeholder: "(555) 123-4567", maxLength: 10 },
  { code: "+52", country: "MX", name: "México", flag: "🇲🇽", placeholder: "55 1234 5678", maxLength: 10 },
  { code: "+351", country: "PT", name: "Portugal", flag: "🇵🇹", placeholder: "912 345 678", maxLength: 9 },
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
    const [validationError, setValidationError] = React.useState("")

    // Parse initial value if provided
    React.useEffect(() => {
      if (value && value !== `${countryCode.replace('+', '')}${phoneNumber.replace(/\D/g, '')}`) {
        const country = countries.find(c => value.startsWith(c.code.replace('+', '')))
        if (country) {
          setCountryCode(country.code)
          setPhoneNumber(value.substring(country.code.length - 1))
        } else {
          // Try to find country by length and common patterns
          const numericValue = value.replace(/\D/g, '')
          if (numericValue.startsWith('55')) {
            setCountryCode('+55')
            setPhoneNumber(numericValue.substring(2))
          } else {
            setPhoneNumber(numericValue)
          }
        }
      }
    }, [value])

    const selectedCountry = countries.find(c => c.code === countryCode) || countries[0]

    const validatePhoneNumber = (phone: string, country: Country): string => {
      const numericPhone = phone.replace(/\D/g, '')
      
      if (country.code === '+55') { // Brasil
        if (numericPhone.length > 11) {
          return "Número muito longo para o Brasil (máx. 11 dígitos)"
        }
        if (numericPhone.length === 11 && !numericPhone.startsWith('9', 2)) {
          return "Celular deve começar com 9 após o DDD"
        }
        if (numericPhone.length < 10) {
          return "Número muito curto (mín. 10 dígitos)"
        }
      } else if (country.code === '+1') { // EUA/Canada
        if (numericPhone.length > 10) {
          return "Número muito longo para os EUA"
        }
      } else {
        if (numericPhone.length > country.maxLength) {
          return `Número muito longo para ${country.name}`
        }
      }
      
      return ""
    }

    const handleCountryChange = (newCountryCode: string) => {
      const newCountry = countries.find(c => c.code === newCountryCode)
      if (!newCountry) return

      setCountryCode(newCountryCode)
      setValidationError("")
      
      // Clear phone number if changing country to avoid invalid formats
      setPhoneNumber("")
      
      // Send only numbers (DDI + phone number) to database
      const numericCountryCode = newCountryCode.replace('+', '')
      onChange?.(numericCountryCode)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Allow only numbers, spaces, parentheses, and hyphens for display
      const cleanedValue = inputValue.replace(/[^\d\s()-]/g, '')
      
      // Extract only numbers for validation and storage
      const numericValue = cleanedValue.replace(/\D/g, '')
      
      // For Brazilian numbers, enforce 11 digit limit during input
      if (countryCode === '+55' && numericValue.length > 11) {
        return // Don't allow more than 11 digits for Brazil
      }
      
      // Validate based on country
      const error = validatePhoneNumber(cleanedValue, selectedCountry)
      setValidationError(error)
      
      setPhoneNumber(cleanedValue)
      
      // Send only numbers (DDI + phone number) to database
      const numericCountryCode = countryCode.replace('+', '')
      const fullNumber = `${numericCountryCode}${numericValue}`
      onChange?.(fullNumber)
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow only numbers and common phone formatting characters
      const allowedChars = /[0-9\s()-]/
      if (!allowedChars.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault()
      }
    }

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex gap-2">
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
            onKeyPress={handleKeyPress}
            placeholder={selectedCountry.placeholder}
            className="flex-1 border-[#DEDEDE] focus:border-[#61710C] placeholder:opacity-30"
          />
        </div>
        {validationError && (
          <p className="text-sm text-red-500">{validationError}</p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
