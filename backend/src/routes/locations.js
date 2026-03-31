import express from 'express';
import { Country, City } from 'country-state-city';

const router = express.Router();

// GET /api/locations/countries
router.get('/countries', (req, res) => {
  try {
    const countries = Country.getAllCountries().map(c => ({
      isoCode: c.isoCode,
      name: c.name
    }));
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/locations/cities/:countryCode
router.get('/cities/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const cities = City.getCitiesOfCountry(countryCode).map(c => ({
      name: c.name,
      stateCode: c.stateCode
    }));
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
