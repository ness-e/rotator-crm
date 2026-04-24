/**
 * @file CountryCitySelect.jsx
 * @description Componente reutilizable de UI: CountryCitySelect.
 * @module Frontend Component
 * @path /frontend/src/components/CountryCitySelect.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import countries from 'world-countries'

// Mapeo de códigos de país comunes a nombres
const countryCodeMap = {
  'VE': 'Venezuela',
  'US': 'United States',
  'MX': 'Mexico',
  'CO': 'Colombia',
  'AR': 'Argentina',
  'CL': 'Chile',
  'PE': 'Peru',
  'ES': 'Spain',
  'FR': 'France',
  'PT': 'Portugal',
  'BR': 'Brazil',
  'EC': 'Ecuador',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'BO': 'Bolivia',
  'CR': 'Costa Rica',
  'PA': 'Panama',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'NI': 'Nicaragua',
  'SV': 'El Salvador',
  'DO': 'Dominican Republic',
  'CU': 'Cuba',
  'JM': 'Jamaica',
  'HT': 'Haiti',
  'TT': 'Trinidad and Tobago',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'GR': 'Greece',
  'IE': 'Ireland',
  'IS': 'Iceland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
}

// Ciudades principales por país (lista básica, se puede expandir)
const citiesByCountry = {
  'VE': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'Puerto La Cruz', 'Petare'],
  'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí'],
  'CO': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Santa Marta'],
  'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
  'CL': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Iquique'],
  'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Huancayo', 'Chimbote', 'Pucallpa'],
  'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
  'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'PT': ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém'],
  'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
  'EC': ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato'],
  'PY': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Ñemby', 'Encarnación'],
  'UY': ['Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes'],
  'BO': ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'Sucre', 'Oruro', 'Tarija', 'Potosí', 'Sacaba', 'Montero', 'Quillacollo'],
  'CR': ['San José', 'Cartago', 'Alajuela', 'Heredia', 'Puntarenas', 'Limón', 'Liberia', 'San Isidro', 'Desamparados', 'San Vicente'],
  'PA': ['Panama City', 'San Miguelito', 'Tocumen', 'David', 'Arraiján', 'Colón', 'Las Cumbres', 'La Chorrera', 'Pacora', 'Santiago'],
  'GT': ['Guatemala City', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Escuintla', 'Villa Canales', 'San Juan Sacatepéquez', 'Chinautla', 'Chimaltenango', 'Huehuetenango'],
  'HN': ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Puerto Cortés', 'La Lima', 'Danlí'],
  'NI': ['Managua', 'León', 'Masaya', 'Chinandega', 'Matagalpa', 'Estelí', 'Granada', 'Tipitapa', 'Juigalpa', 'Bluefields'],
  'SV': ['San Salvador', 'Soyapango', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Santa Tecla', 'Apopa', 'Delgado', 'Ahuachapán', 'Sonsonate'],
  'DO': ['Santo Domingo', 'Santiago', 'Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'San Cristóbal', 'La Vega', 'San Pedro de Macorís', 'Puerto Plata', 'Bonao'],
  'CU': ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo', 'Bayamo', 'Las Tunas', 'Cienfuegos', 'Pinar del Río'],
  'JM': ['Kingston', 'New Kingston', 'Spanish Town', 'Portmore', 'Montego Bay', 'Mandeville', 'May Pen', 'Old Harbour', 'Linstead', 'Savanna-la-Mar'],
  'HT': ['Port-au-Prince', 'Carrefour', 'Delmas', 'Pétion-Ville', 'Gonaïves', 'Cap-Haïtien', 'Saint-Marc', 'Les Cayes', 'Verrettes', 'Jacmel'],
  'TT': ['Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Couva', 'Point Fortin', 'Tunapuna', 'Scarborough', 'Sangre Grande', 'Princes Town'],
  'CA': ['Toronto', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Vancouver', 'Brampton', 'Hamilton'],
  'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],
  'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
  'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
  'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'],
  'BE': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'],
  'CH': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel'],
  'AT': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'],
  'SE': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'],
  'NO': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Fredrikstad', 'Sandnes', 'Tromsø', 'Sarpsborg'],
  'DK': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'],
  'FI': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'],
  'PL': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'],
  'CZ': ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Ústí nad Labem', 'České Budějovice', 'Hradec Králové', 'Pardubice'],
  'GR': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Kavala'],
  'IE': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan'],
  'IS': ['Reykjavík', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Reykjanesbær', 'Garðabær', 'Mosfellsbær', 'Árborg', 'Akranes', 'Selfoss'],
  'LU': ['Luxembourg', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Wiltz', 'Echternach', 'Rumelange', 'Grevenmacher'],
  'MT': ['Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'Sliema', 'San Ġwann', 'Fgura', 'Żejtun', 'Marsaskala'],
  'CY': ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia', 'Protaras', 'Ayia Napa', 'Paralimni', 'Polis'],
}

// Obtener lista de países ordenados
const sortedCountries = countries
  .map(c => ({ code: c.cca2, name: c.name.common }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function CountrySelect({ value, onChange, ...props }) {
  return (
    <Select value={value || ''} onValueChange={onChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar país" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {sortedCountries.map(country => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CitySelect({ country, value, onChange, ...props }) {
  const cities = useMemo(() => {
    if (!country) return []
    return citiesByCountry[country] || []
  }, [country])

  if (!country) {
    return (
      <Select disabled {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un país primero" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value || ''} onValueChange={onChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar ciudad" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {cities.length > 0 ? (
          cities.map(city => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="" disabled>
            No hay ciudades disponibles
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

