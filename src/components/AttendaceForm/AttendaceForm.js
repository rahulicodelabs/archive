import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://tivsrbykzsmbrkmqqwwd.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Ensure this is correctly set in your .env file
const supabase = createClient(supabaseUrl, supabaseKey);

const AttendanceForm = ({ activity, onBack }) => {
  const [checkedNames, setCheckedNames] = useState([]);

  // Extract names from activity, fallback to an empty array if not available
  const names = activity?.resource?.bookingData?.names ?? [];

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      // Assuming the ID you need is activity.resource.bookingData.bookingId
      const bookingId = activity?.resource?.bookingData?.bookingId;
      if (!bookingId) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('name, checked_status')
        .eq('booking_id', bookingId);

      if (error) {
        console.error('Error fetching attendance records:', error);
        return;
      }

      // Log the fetched data to see what's being returned
      console.log('Fetched attendance records:', data);

      // Update state with fetched records
      const fetchedCheckedNames = data
        .filter(record => record.checked_status)
        .map(record => record.name);
      setCheckedNames(fetchedCheckedNames);
    };

    fetchAttendanceRecords();
    // Ensure to update this dependency array to reflect the correct path to the ID
  }, [activity?.resource?.bookingData?.bookingId]);

  const handleCheck = name => {
    setCheckedNames(prevState =>
      prevState.includes(name) ? prevState.filter(n => n !== name) : [...prevState, name]
    );
  };

  const handleSave = async () => {
    const promises = names.map(name => {
      const record = {
        booking_id: activity.resource.bookingData.bookingId,
        name,
        checked_status: checkedNames.includes(name),
      };
      console.log('record is ', record);
      return supabase.from('attendance').upsert(record); // Implicitly uses the composite primary key for conflict resolution
    });

    const results = await Promise.all(promises);

    for (const { error } of results) {
      if (error) {
        console.error('Error saving record:', error);
        // Optionally handle this error more gracefully
        return;
      }
    }

    console.log('All records saved/updated successfully.');
  };

  const handleDelete = async () => {
    // Your delete activity logic here
  };

  return (
    <div>
      {names.map((name, index) => (
        <div key={index}>
          <input
            type="checkbox"
            checked={checkedNames.includes(name)}
            onChange={() => handleCheck(name)}
          />
          <label>{name}</label>
        </div>
      ))}
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete Activity</button>
      <button onClick={onBack}>Back to Calendar</button>
    </div>
  );
};

export default AttendanceForm;
