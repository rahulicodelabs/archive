import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
// import styles from './Calendar.module.css';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
import { v4 as uuidv4 } from 'uuid';
import {
  queryOwnListings,
  getOwnListingsById,
} from '../../containers/ManageListingsPage/ManageListingsPage.duck';
import { loadData2 } from '../../containers/InboxPage/InboxPage.duck';
import AttendanceForm from '../AttendaceForm/AttendaceForm';

const randomId = () => uuidv4();
const localizer = momentLocalizer(moment);
const dayOfWeekMap = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};
function mergeTransactionsAndBookings(response) {
  const { data: transactions, included: bookingsAndOthers } = response;
  const bookings = bookingsAndOthers.filter(item => item.type === 'booking');

  // Extract transactions and their associated bookings
  // Assuming transactions and bookings are defined

  const mergedData = transactions.map(transaction => {
    const bookingId = transaction.relationships.booking.data.id.uuid;
    const transactionBooking = bookings.find(booking => booking.id.uuid === bookingId);

    return {
      id: transaction.id.uuid,
      bookingId: bookingId, // Include bookingId explicitly
      seats: transactionBooking?.attributes?.seats,
      start: transactionBooking?.attributes?.start,
      end: transactionBooking?.attributes?.end,
      protectedData: transaction?.attributes?.protectedData,
    };
  });

  // Group bookings by start date
  const groupedByStart = mergedData.reduce((acc, curr) => {
    const key = curr.start; // Adjust for Date objects if necessary
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {});

  // Merge bookings with the same start date
  const mergedByStart = Object.values(groupedByStart).map(group => {
    if (group.length === 1) {
      // For a single booking, modify protectedData to format names into an array
      const { protectedData, ...rest } = group[0];
      // Remove unitType and collect names into an array
      const { unitType, ...namesData } = protectedData;
      const names = Object.values(namesData); // This collects all name values into an array

      return {
        ...rest,
        protectedData: {
          names, // Use the names array here
        },
      };
    }

    return group.reduce((merged, booking, index) => {
      // Sum seats
      const totalSeats = (merged.seats || 0) + booking.seats;

      // Collect names from protectedData into an array, add unitType: 'day' only for grouped bookings
      let names = [];
      if (index === 1) {
        names = Object.values(merged.protectedData).filter(value => typeof value === 'string');
      }
      names = names.concat(
        Object.values(booking.protectedData).filter(value => typeof value === 'string')
      );
      return {
        id: index === 1 ? booking.id : `${merged.id},${booking.id}`, // Correctly merge IDs
        bookingId: index === 1 ? booking.bookingId : merged.bookingId, // Keep the first bookingId
        seats: totalSeats,
        start: booking.start,
        end: booking.end,
        protectedData: {
          names: [...new Set(names)], // Remove duplicates, if any
        },
      };
    });
  });
  console.log(mergedByStart);
  return mergedByStart;
}

const transformListingsToEvents = (
  ownListings,
  year = moment().year(),
  month = moment().month() + 1
) => {
  let events = [];

  ownListings.forEach(listing => {
    // Calculate the start and end of the given month and year
    // Note: moment's months are 0-indexed, so subtract 1 for accurate calculation
    const monthStart = moment([year, month - 1]); // Adjust for moment's 0-indexed months
    const monthEnd = moment(monthStart).endOf('month');

    while (monthStart.isBefore(monthEnd)) {
      listing.attributes.availabilityPlan.entries.forEach(entry => {
        // Step 2: Use the map to get the day of week number
        const dayOfWeekNumber = dayOfWeekMap[entry.dayOfWeek.toLowerCase()];
        const currentDayOfWeekNumber = monthStart.day();

        if (currentDayOfWeekNumber === dayOfWeekNumber) {
          const startDateTime = monthStart
            .clone()
            .hour(parseInt(entry.startTime.split(':')[0]))
            .minute(parseInt(entry.startTime.split(':')[1]));
          const endDateTime = monthStart
            .clone()
            .hour(parseInt(entry.endTime.split(':')[0]))
            .minute(parseInt(entry.endTime.split(':')[1]));

          events.push({
            id: `${listing.id.uuid}-${monthStart.format('YYYY-MM-DD')}`,
            title: listing.attributes.title,
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            allDay: false,
            resource: listing,
          });
        }
      });
      monthStart.add(1, 'days'); // Move to the next day
    }
  });

  return events;
};
const MyCalendar = ({ ownListings, fetchOwnListings, fetchOrdersOrSales }) => {
  const [mergedBookings, setMergedBookings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState({ resource: null, bookingData: null });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchOwnListings();
    const params = { tab: 'sales' };
    const search = '';
    fetchOrdersOrSales(params, search)
      .then(response => {
        const mergedData = mergeTransactionsAndBookings(response.data);
        setMergedBookings(mergedData); // Store the merged bookings data
      })
      .catch(error => {
        console.error('Error fetching orders or sales:', error);
      });
  }, [fetchOwnListings, fetchOrdersOrSales]);

  const events = transformListingsToEvents(ownListings);

  const handleSelectEvent = event => {
    setSelectedListing(event.resource);
    setSelectedEventDate(event.start);

    const matchedBooking = mergedBookings.find(booking =>
      moment(booking.start).isSame(event.start, 'day')
    );

    if (matchedBooking) {
      setSelectedActivity({
        resource: event.resource,
        bookingData: {
          ...matchedBooking.protectedData, // Preserve the existing booking data
          bookingId: matchedBooking.bookingId, // Include the bookingId
        },
      });
    } else {
      setSelectedActivity({ resource: event.resource, bookingData: null });
    }
  };

  const handleBack = () => {
    setShowForm(false); // Hide AttendanceForm and show the calendar again
    // Reset any state as necessary, such as selectedActivity, etc.
  };

  const handleSelectActivity = activity => {
    // Assuming `activity` is an entry from `selectedListing.attributes.availabilityPlan.entries`
    // and `selectedActivity.bookingData` already contains the booking data set by `handleSelectEvent`
    if (selectedActivity.bookingData) {
      setSelectedActivity({
        resource: {
          ...activity,
          bookingData: selectedActivity.bookingData, // Preserve existing booking data
        },
      });
    } else {
      // Fallback if no booking data is available
      setSelectedActivity({ resource: activity });
    }
    setShowForm(true);
  };

  const getDayOfWeekNumberFromDate = date => {
    return moment(date).day();
  };

  const dayPropGetter = date => {
    const hasEvents = events.some(
      event => moment(date).isSame(event.start, 'day') || moment(date).isSame(event.end, 'day')
    );

    return {
      style: {
        backgroundColor: hasEvents ? '#f0f0f0' : 'inherit', // Change '#f0f0f0' to your highlight color
      },
    };
  };
  return (
    <div>
      {!showForm ? (
        <>
          <Calendar
            localizer={localizer}
            events={events}
            onSelectEvent={handleSelectEvent}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, margin: '50px' }}
          />
          {selectedListing && selectedEventDate && (
            <div style={{ marginTop: '20px' }}>
              <h3>Selected Activity:</h3>
              {selectedListing.attributes.availabilityPlan.entries
                .filter(activity => {
                  const dayOfWeekNumberForEvent = getDayOfWeekNumberFromDate(selectedEventDate);
                  const dayOfWeekNumberForActivity = dayOfWeekMap[activity.dayOfWeek.toLowerCase()];
                  return dayOfWeekNumberForEvent === dayOfWeekNumberForActivity;
                })
                .map(activity => (
                  <li key={randomId()} onClick={() => handleSelectActivity(activity)}>
                    {activity.startTime} {selectedListing.attributes.title} Seats: {activity.seats}
                  </li>
                ))}
            </div>
          )}
        </>
      ) : (
        <AttendanceForm activity={selectedActivity} onBack={handleBack} />
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  transactionRefs: state.InboxPage.transactionRefs,
  transactions: state.InboxPage.transactions,
  booking: state.InboxPage.booking,
  ownListings: getOwnListingsById(state, state.ManageListingsPage.currentPageResultIds),
});

const mapDispatchToProps = dispatch => ({
  fetchOwnListings: () => dispatch(queryOwnListings({})),
  fetchOrdersOrSales: (params, search) => dispatch(loadData2(params, search)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyCalendar);
