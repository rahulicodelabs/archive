import React from 'react';
import MyCalendar from '../../components/Calendar/Calendar';
import AttendanceForm from '../../components/AttendaceForm/AttendaceForm';
// Import other components as needed

// Map pageIds to specific components
const pageComponentMap = {
   overview: MyCalendar,
  // overview: AttendanceForm,
  // Add other pageId to component mappings here
};

/**
 * A function that returns the component associated with a given pageId.
 * @param {string} pageId - The ID of the page to render.
 * @param {Object} props - Props to be passed to the dynamically loaded component.
 * @returns {React.Component|null} - The component to render, or null if no match is found.
 */
const dynamicLoader = (pageId, props) => {
  console.log('page', pageId, props)
  const Component = pageComponentMap[pageId];

  if (Component) {
    // If a component is found for the pageId, return it with the passed props
    return <Component {...props} />;
  } else {
    // Return null or a default component if there is no match for the pageId
    return null;
  }
};

export default dynamicLoader;
