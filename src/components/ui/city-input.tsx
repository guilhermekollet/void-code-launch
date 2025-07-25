import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"

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
  const [inputValue, setInputValue] = useState(value || "")
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  const searchCities = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setCities([])
      setOpen(false)
      return
    }

    setLoading(true)
    setOpen(true)
    try {
      // Tentar usar a edge function primeiro
      const { data, error } = await supabase.functions.invoke('get-cities', {
        body: { searchTerm }
      })

      if (error) throw error

      if (data && data.cities) {
        setCities(data.cities.map((city: any) => ({
          id: city.id,
          nome: city.name,
          microrregiao: {
            mesorregiao: {
              UF: {
                sigla: city.state,
                nome: city.stateName
              }
            }
          }
        })))
      } else {
        setCities([])
      }
    } catch (error) {
      console.error('Erro ao buscar cidades via edge function, tentando API direta:', error)
      
      // Fallback para API direta do IBGE
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`
        )
        const allCities: City[] = await response.json()
        
        // Filtrar cidades que começam com o termo de busca
        const filteredCities = allCities.filter(city => 
          city.nome.toLowerCase().startsWith(searchTerm.toLowerCase())
        )
        
        // Ordenar por nome e limitar a 20 resultados
        const sortedCities = filteredCities
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .slice(0, 20)
        
        setCities(sortedCities)
      } catch (fallbackError) {
        console.error('Erro ao buscar cidades via API direta:', fallbackError)
        setCities([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchCities(inputValue)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue])

  // Sync with external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onValueChange?.(newValue)
  }

  const handleSelect = (city: City) => {
    const cityString = `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
    setInputValue(cityString)
    onValueChange?.(cityString)
    setOpen(false)
    setCities([])
    // Limpar estado de busca para evitar mostrar "nenhuma cidade encontrada"
    setTimeout(() => {
      setCities([])
    }, 100)
  }

  const handleInputFocus = () => {
    if (inputValue.length >= 3) {
      setOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay closing to allow for click events on dropdown items
    setTimeout(() => setOpen(false), 200)
  }

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={cn("w-full", className)}
      />
      
      {open && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto">
            {loading && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Buscando cidades...
              </div>
            )}
            
            {!loading && inputValue.length >= 3 && cities.length === 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Nenhuma cidade encontrada
              </div>
            )}
            
            {!loading && inputValue.length < 3 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Digite pelo menos 3 caracteres para buscar
              </div>
            )}
            
            {cities.map((city) => {
              const cityString = `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
              const isSelected = inputValue === cityString
              
              return (
                <div
                  key={city.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevent input blur
                    handleSelect(city)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{city.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {city.microrregiao.mesorregiao.UF.sigla}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}