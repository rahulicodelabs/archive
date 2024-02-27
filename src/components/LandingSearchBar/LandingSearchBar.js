import React, { useState, useEffect } from 'react';
import { DateRangePicker } from 'react-dates';
import css from './LandingSearchBar.module.css';
// import 'react-dates/lib/css/_datepicker.css';
import { useHistory } from 'react-router-dom';
import { createResourceLocatorString } from '../../util/routes';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import landingCover from '../../media/landingCover.jpg';

const LandingSearchBar = props => {
  const routeConfiguration = useRouteConfiguration();
  const searchPagePath = routeConfiguration
    ? createResourceLocatorString('SearchPage', routeConfiguration, {}, {})
    : '';
  const [location, setLocation] = useState('');
  const [bounds, setBounds] = useState(null); // Update for dynamic bounds
  const [joy, setJoy] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (window.google && window.google.maps) {
      initAutocomplete();
    }
  }, []);

  const initAutocomplete = () => {
    const autocomplete = new window.google.maps.places.Autocomplete(
      document.getElementById('location-input'),
      { types: ['geocode'] }
    );
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.log('Returned place contains no geometry');
        return;
      }
      const bounds = {
        ne: {
          _sdkType: 'LatLng',
          lat: place.geometry.viewport.getNorthEast().lat(),
          lng: place.geometry.viewport.getNorthEast().lng(),
        },
        sw: {
          _sdkType: 'LatLng',
          lat: place.geometry.viewport.getSouthWest().lat(),
          lng: place.geometry.viewport.getSouthWest().lng(),
        },
        _sdkType: 'LatLngBounds',
      };
      setBounds(bounds); // Update bounds state
    });
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Check if bounds are set
    if (!bounds) {
      alert('Please select a location from the dropdown.');
      return;
    }

    // Format bounds as "latNE,lngNE,latSW,lngSW"
    const formattedBounds = `${bounds.ne.lat},${bounds.ne.lng},${bounds.sw.lat},${bounds.sw.lng}`;

    // Initialize an array to collect query parts
    let queryParts = [`bounds=${encodeURIComponent(formattedBounds)}`];

    // Format dates and add to query if both dates are present
    if (startDate && endDate) {
      const startDateFormatted = startDate.format('YYYY-MM-DD');
      const endDateFormatted = endDate.format('YYYY-MM-DD');
      queryParts.push(`dates=${startDateFormatted},${endDateFormatted}`);
    }

    // Add joy to query if it has a value
    if (joy) {
      queryParts.push(`pub_joy=${joy}`);
    }

    // Join the query parts with "&"
    let searchParams = queryParts.join('&');

    // Navigate to the search page with the constructed query
    if (routeConfiguration) {
      const queryString = `?${searchParams}`;
      const searchPageUrl = `${searchPagePath}${queryString}`;
      history.push(searchPageUrl);
    } else {
      console.error('Route configuration is undefined');
    }
  };

  return (
    <div className={css.landingBarContainer} style={{ backgroundImage: `url(${landingCover})` }}>
      <div className={css.introText}>
        Hai provato tutta Milano ormai?
        <br /> E invece no
      </div>

      <form onSubmit={handleSubmit} className={css.form}>
        <select value={joy} onChange={e => setJoy(e.target.value)}>
          <option value="">Search for joys...</option>
          <option value="ceramic">Ceramic</option>
          <option value="paint">Paint</option>
          <option value="food">Food</option>
          <option value="plants">Plants</option>
        </select>

        <div>
          <DateRangePicker
            startDate={startDate}
            startDateId="your_unique_start_date_id"
            endDate={endDate}
            endDateId="your_unique_end_date_id"
            onDatesChange={({ startDate, endDate }) => {
              setStartDate(startDate);
              setEndDate(endDate);
            }}
            focusedInput={focusedInput}
            onFocusChange={focusedInput => setFocusedInput(focusedInput)}
            isOutsideRange={() => false}
          />
        </div>

        <input
          id="location-input"
          type="text"
          placeholder="Enter a location"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />

        <button type="submit" className={css.button}>
          Search
        </button>
      </form>
    </div>
  );
};

export default LandingSearchBar;
