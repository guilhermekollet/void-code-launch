import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface City {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      };
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();

    if (!searchTerm || searchTerm.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: "Search term must be at least 3 characters long" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[get-cities] Searching for cities with term: ${searchTerm}`);

    // Fetch cities from IBGE API
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`
    );

    if (!response.ok) {
      throw new Error(`IBGE API returned status ${response.status}`);
    }

    const allCities: City[] = await response.json();

    // Filter cities that start with the search term (case insensitive)
    const filteredCities = allCities.filter(city => 
      city.nome.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    // Sort by name and limit to 20 results
    const sortedCities = filteredCities
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .slice(0, 20)
      .map(city => ({
        id: city.id,
        name: city.nome,
        state: city.microrregiao.mesorregiao.UF.sigla,
        stateName: city.microrregiao.mesorregiao.UF.nome,
        displayName: `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
      }));

    console.log(`[get-cities] Found ${sortedCities.length} cities`);

    return new Response(
      JSON.stringify({ cities: sortedCities }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[get-cities] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to fetch cities" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);