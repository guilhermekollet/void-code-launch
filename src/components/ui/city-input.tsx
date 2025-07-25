import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface City {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string
        nome: string
      }
    }
  }
}

interface CityInputProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function CityInput({
  value,
  onValueChange,
  placeholder = "Selecione sua cidade",
  className
}: CityInputProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>(value || "")
  const debounceRef = useRef<NodeJS.Timeout>()

  const searchCities = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setCities([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(searchTerm)}`
      )
      const data: City[] = await response.json()
      
      // Ordenar por nome e limitar a 20 resultados
      const sortedCities = data
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .slice(0, 20)
      
      setCities(sortedCities)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
      setCities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchCities(searchValue)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchValue])

  const handleSelect = (city: City) => {
    const cityString = `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
    setSelectedCity(cityString)
    onValueChange?.(cityString)
    setOpen(false)
    setSearchValue("")
  }

  const displayValue = selectedCity || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            !selectedCity && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white border border-gray-200 shadow-lg" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Digite o nome da cidade..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        
        <div className="max-h-60 overflow-auto">
          {loading && (
            <div className="p-3 text-center text-sm text-gray-500">
              Buscando cidades...
            </div>
          )}
          
          {!loading && searchValue.length >= 3 && cities.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500">
              Nenhuma cidade encontrada
            </div>
          )}
          
          {!loading && searchValue.length < 3 && (
            <div className="p-3 text-center text-sm text-gray-500">
              Digite pelo menos 3 caracteres para buscar
            </div>
          )}
          
          {cities.map((city) => {
            const cityString = `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
            const isSelected = selectedCity === cityString
            
            return (
              <div
                key={city.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                  isSelected && "bg-blue-50"
                )}
                onClick={() => handleSelect(city)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{city.nome}</span>
                  <span className="text-xs text-gray-500">
                    {city.microrregiao.mesorregiao.UF.nome} ({city.microrregiao.mesorregiao.UF.sigla})
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}