/**
 * @file GlobalSelects.jsx
 * @description Componente reutilizable de UI: GlobalSelects.
 * @module Frontend Component
 * @path /frontend/src/components/GlobalSelects.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Country, State, City } from 'country-state-city';
import 'react-phone-number-input/style.css';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import es from 'react-phone-number-input/locale/es';

// --- Country Select ---
// --- Cache for IP location to prevent repeated requests ---
let cachedCountry = null;
const fetchCountry = async () => {
    if (cachedCountry) return cachedCountry;
    try {
        const res = await fetch('https://ipapi.co/json/');
        // Check content type to avoid parsing HTML error pages if quota exceeded
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            if (data.country_code) {
                cachedCountry = data.country_code;
                return cachedCountry;
            }
        }
    } catch (error) {
        console.warn("Auto-detect country failed", error);
    }
    return 'CO'; // Fallback to Colombia
};

export function GlobalCountrySelect({ value, onChange, className }) {
    const [open, setOpen] = React.useState(false)
    const countries = Country.getAllCountries()

    // Auto-detect country on mount if no value is provided
    React.useEffect(() => {
        if (!value) {
            fetchCountry().then(code => {
                // Verify the code exists in our country list before setting
                if (code && countries.some(c => c.isoCode === code)) {
                    // defer to avoid conflict with initial render if needed, but safe here
                    onChange(code);
                }
            })
        }
    }, []) // Run once on mount

    const selectedCountry = countries.find((country) => country.isoCode === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {selectedCountry ? (
                        <>
                            <span className="mr-2 text-lg">{selectedCountry.flag}</span>
                            {selectedCountry.name}
                        </>
                    ) : (
                        "Selecciona país..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar país..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>No se encontró el país.</CommandEmpty>
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.isoCode}
                                    value={country.name}
                                    onSelect={() => {
                                        onChange(country.isoCode)
                                        setOpen(false)
                                    }}
                                >
                                    <span className="mr-2 text-lg">{country.flag}</span>
                                    {country.name}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === country.isoCode ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// --- State/City Select (Generic for subdivision) ---
export function GlobalStateSelect({ countryCode, value, onChange, className }) {
    const [open, setOpen] = useState(false);
    const states = countryCode ? State.getStatesOfCountry(countryCode) : [];

    useEffect(() => {
        if (!countryCode) onChange('');
    }, [countryCode]);

    if (!countryCode) {
        return (
            <Button variant="outline" disabled className="w-full justify-start text-muted-foreground">
                Selecciona un país primero
            </Button>
        )
    }

    if (states.length === 0) {
        return (
            <Button variant="outline" disabled className="w-full justify-start text-muted-foreground">
                No hay estados/provincias
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                >
                    {value
                        ? states.find((state) => state.isoCode === value)?.name
                        : "Seleccionar estado/provincia..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar estado..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {states.map((state) => (
                                <CommandItem
                                    key={state.isoCode}
                                    value={state.name}
                                    onSelect={() => {
                                        onChange(state.isoCode);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === state.isoCode ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {state.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// --- City Select ---
export function GlobalCitySelect({ countryCode, stateCode, value, onChange, className }) {
    // Note: City codes in this library aren't ISO standard like countries/states, usually used by name
    const [open, setOpen] = useState(false);
    const cities = (countryCode && stateCode)
        ? City.getCitiesOfState(countryCode, stateCode)
        : (countryCode ? City.getCitiesOfCountry(countryCode) : []); // Fallback to country cities if state not selected (though heavy)

    // Optimize: If huge list, maybe just simple input? But let's try popover first.
    // Cities can be many.

    if (!countryCode) {
        return (
            <Button variant="outline" disabled className="w-full justify-start text-muted-foreground">
                Selecciona país/estado
            </Button>
        )
    }

    // If too many cities or simple input preferred, we can switch. 
    // For now, let's assume we want a searchable select.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                >
                    {value || "Seleccionar ciudad..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar ciudad..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>No encontrada.</CommandEmpty>
                        <CommandGroup>
                            {cities.slice(0, 100).map((city) => ( // Limit rendering for perf
                                <CommandItem
                                    key={city.name + city.latitude}
                                    value={city.name}
                                    onSelect={() => {
                                        onChange(city.name); // Using name as value for city
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === city.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {city.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


// --- Phone Input ---
const PhoneCountrySelect = ({ value, onChange, options, iconComponent: Icon }) => {
    const [open, setOpen] = React.useState(false);
    
    // Filter out the 'ZZ' (International) option which doesn't have a value
    const selectedOption = options.find((o) => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="flex gap-1 px-2 h-8 w-[100px] justify-between hover:bg-transparent"
                >
                    {selectedOption && Icon ? (
                        <div className="flex items-center gap-1">
                            <span className="w-5 flex items-center justify-center flex-shrink-0">
                                <Icon country={value} label={selectedOption.label} />
                            </span>
                            <span className="text-sm">+{getCountryCallingCode(value)}</span>
                        </div>
                    ) : (
                        <span className="text-sm">País</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 z-[100]">
                <Command>
                    <CommandInput placeholder="Buscar código o país..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {options.filter(o => o.value).map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} +${getCountryCallingCode(option.value)}`}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <span className="w-5 flex items-center justify-center flex-shrink-0">
                                        {Icon && <Icon country={option.value} label={option.label} />}
                                    </span>
                                    <span className="flex-1 truncate">{option.label}</span>
                                    <span className="text-muted-foreground text-xs flex-shrink-0">
                                        +{getCountryCallingCode(option.value)}
                                    </span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export const GlobalPhoneInput = React.forwardRef(({ value, onChange, className }, ref) => {
    const [defaultCountry, setDefaultCountry] = React.useState("CO");

    React.useEffect(() => {
        // If fetchCountry was defined in module scope (which it is now), use it.
        // If not, we fallback to CO.
        // Since we defined it above in the file, it is available.
        if (typeof fetchCountry === 'function') {
            fetchCountry().then(code => {
                if (code) setDefaultCountry(code);
            });
        }
    }, []);

    // Custom styles to override react-phone-number-input and match shadcn/ui
    // Using !important to force override of library default styles
    return (
        <div ref={ref} className={cn("relative", className)}>
            <style>{`
                .PhoneInput {
                    display: flex;
                    align-items: center;
                }
                .PhoneInputCountry {
                    margin-right: 0.5rem;
                }
                .PhoneInputInput {
                    flex: 1;
                    min-width: 0;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    color: inherit !important;
                    font-size: 0.875rem !important;
                    box-shadow: none !important;
                }
                .PhoneInputInput:focus {
                    outline: none !important;
                    ring: 0 !important;
                }
            `}</style>
            <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <PhoneInput
                    placeholder="Número de teléfono"
                    value={!value || value === '0' || value === 0 ? undefined : String(value)}
                    onChange={onChange}
                    labels={es}
                    defaultCountry={defaultCountry}

                    countrySelectComponent={PhoneCountrySelect}

                    className="flex-1 bg-transparent border-none outline-none shadow-none"
                    numberInputProps={{
                        className: "bg-transparent border-none outline-none text-sm w-full focus:ring-0 focus:outline-none placeholder:text-muted-foreground"
                    }}
                />
            </div>
        </div>
    )
});

GlobalPhoneInput.displayName = 'GlobalPhoneInput';
