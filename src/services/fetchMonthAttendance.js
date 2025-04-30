import { format, subDays, isWeekend as isWeekendFn, parseISO } from 'date-fns';
import axios from 'axios';
import { getAuthHeader, refreshAccessToken } from './authService';
import { processZohoAttendanceData } from './attendanceService';
import { getApiUrl } from '../config/apiConfig';

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  try {
    // Always use the current date and month but with the current year
    const currentYear = new Date().getFullYear();
    
    // Extract day and month from the provided date
    const day = format(date, 'dd');
    const month = format(date, 'MM');
    
    // Construct the date string manually to ensure current year
    const formattedDate = `${day}-${month}-${currentYear}`;
    
    console.log(`Formatted date for Zoho API: ${formattedDate} (original date: ${format(date, 'yyyy-MM-dd')})`);
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date for Zoho API:', error);
    // Fallback to current date with current year as a last resort
    const now = new Date();
    return format(now, 'dd-MM-') + now.getFullYear();
  }
};

// Helper function to process a date record consistently
const processDateRecord = (record, dateKey, employeeId) => {
  // Extract check-in time
  let checkInTime = null;
  if (record.FirstIn && record.FirstIn !== '-') {
    // Try different regex patterns to extract time
    let match = record.FirstIn.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/);
    if (!match) {
      // Try alternative format
      const parts = record.FirstIn.split(' ');
      if (parts.length >= 3) {
        checkInTime = `${parts[parts.length-2]} ${parts[parts.length-1]}`;
      }
    } else {
      checkInTime = match[1];
    }
  }
  
  // Extract check-out time
  let checkOutTime = null;
  if (record.LastOut && record.LastOut !== '-') {
    // Try different regex patterns to extract time
    let match = record.LastOut.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/);
    if (!match) {
      // Try alternative format
      const parts = record.LastOut.split(' ');
      if (parts.length >= 3) {
        checkOutTime = `${parts[parts.length-2]} ${parts[parts.length-1]}`;
      }
    } else {
      checkOutTime = match[1];
    }
  }
  
  // Determine status
  let status = 'Absent';
  
  // If check-in time exists, always mark as Present regardless of other status
  if (checkInTime) {
    status = 'Present';
  } else if (record.Status) {
    status = record.Status;
  }
  
  // Create a record object
  return {
    employeeId,
    date: dateKey,
    checkInTime,
    checkOutTime,
    status: status,
    isHoliday: status.toLowerCase().includes('holiday'),
    holidayName: status.toLowerCase().includes('holiday') ? status : '',
    isWeekend: isWeekendFn(new Date(dateKey)),
    isLeave: status.toLowerCase().includes('leave'),
    leaveType: status.toLowerCase().includes('leave') ? status : '',
    shiftName: record.ShiftName || '',
    shiftStartTime: record.ShiftStartTime || '',
    shiftEndTime: record.ShiftEndTime || '',
    location: record.FirstIn_Location || ''
  };
};

/**
 * Fetch attendance data for employees for a specified date range
 * This function fetches data once and returns it in a format that can be filtered locally
 * @param {Array} employeeIds - Array of employee IDs to fetch attendance for
 * @param {string} [customStartDate] - Optional start date in DD-MM-YYYY format
 * @param {string} [customEndDate] - Optional end date in DD-MM-YYYY format
 * @returns {Object} - Object with employee IDs as keys and arrays of attendance records as values
 */
export const fetchMonthAttendance = async (employeeIds, customStartDate, customEndDate) => {
  console.log('fetchMonthAttendance called with employee IDs:', employeeIds);
  console.log('Custom date range:', customStartDate, 'to', customEndDate);
  
  // First, ensure we have a fresh token
  try {
    await refreshAccessToken();
  } catch (tokenError) {
    console.error('Error refreshing token:', tokenError);
  }
  
  let startDateStr, endDateStr;
  
  // If custom dates are provided, use them directly
  if (customStartDate && customEndDate) {
    startDateStr = customStartDate;
    endDateStr = customEndDate;
    console.log('Using custom date range for API request:', startDateStr, 'to', endDateStr);
  } else {
    // Otherwise use the default 30 day range
    const today = new Date();
    const startDate = subDays(today, 30); // Get data for the last 30 days
    
    // Use the exact date format that works in the direct URL
    startDateStr = formatDateForZoho(startDate);
    endDateStr = formatDateForZoho(today);
    
    console.log('Using default date range for API request:', startDateStr, 'to', endDateStr);
  }
  
  // Date range for API request
  // startDate: startDateStr
  // endDate: endDateStr
  
  try {
    // Create an array of promises for each employee
    const attendancePromises = employeeIds.map(async (employeeId) => {
      try {
        const authHeader = await getAuthHeader();
        
        // Use the exact format that works in the direct URL
        const requestParams = {
          sdate: startDateStr,
          edate: endDateStr,
          empId: employeeId
        };
        
        console.log(`API request for employee ${employeeId}:`, requestParams);
        
        // Make API request for employee with the date parameters
        
        const response = await axios.get(
          getApiUrl('/attendance/getUserReport'), {
            params: requestParams,
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        // Process the raw data
        const rawData = response.data;
        
        const processedRecords = [];
        
        // Check if we have direct date keys in the response (most common format)
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && Object.keys(rawData).length > 0) {
          // Process each date's data directly from the raw data
          Object.keys(rawData).forEach(dateKey => {
            const record = rawData[dateKey];
            if (record) {
              processedRecords.push(processDateRecord(record, dateKey, employeeId));
            }
          });
        }
        // If data is in response.result format (alternative format)
        else if (rawData && rawData.response && rawData.response.result) {
          const dateData = rawData.response.result;
          
          // Check if there's any data
          if (Object.keys(dateData).length === 0) {
            // Create a default record for today
            const todayFormatted = format(today, 'yyyy-MM-dd');
            const defaultRecord = {
              employeeId,
              date: todayFormatted,
              checkInTime: null,
              checkOutTime: null,
              status: 'Yet to Check In',
              isHoliday: false,
              holidayName: '',
              isWeekend: isWeekendFn(today),
              isLeave: false,
              leaveType: '',
              shiftName: '',
              shiftStartTime: '',
              shiftEndTime: '',
              location: ''
            };
            
            processedRecords.push(defaultRecord);
            return { employeeId, records: processedRecords };
          }
          
// Process each date's data
Object.keys(dateData).forEach(dateKey => {
  const record = dateData[dateKey];
  if (record) {
    processedRecords.push(processDateRecord(record, dateKey, employeeId));
  }
});
          
          // If we still don't have any records, create a default one for today
          if (processedRecords.length === 0) {
            const todayFormatted = format(today, 'yyyy-MM-dd');
            const defaultRecord = {
              employeeId,
              date: todayFormatted,
              checkInTime: null,
              checkOutTime: null,
              status: 'Yet to Check In',
              isHoliday: false,
              holidayName: '',
              isWeekend: isWeekendFn(today),
              isLeave: false,
              leaveType: '',
              shiftName: '',
              shiftStartTime: '',
              shiftEndTime: '',
              location: ''
            };
            
            processedRecords.push(defaultRecord);
          }
        }
        // If we couldn't find any data in the expected formats, create a default record
        else {
          const todayFormatted = format(today, 'yyyy-MM-dd');
          const defaultRecord = {
            employeeId,
            date: todayFormatted,
            checkInTime: null,
            checkOutTime: null,
            status: 'Yet to Check In',
            isHoliday: false,
            holidayName: '',
            isWeekend: isWeekendFn(today),
            isLeave: false,
            leaveType: '',
            shiftName: '',
            shiftStartTime: '',
            shiftEndTime: '',
            location: ''
          };
          
          processedRecords.push(defaultRecord);
        }
        
        return { employeeId, records: processedRecords };
      } catch (error) {
        console.error(`Error fetching attendance for employee ${employeeId}:`, error);
        
        // Extract error details for better error handling
        let errorMessage = 'Failed to fetch attendance data';
        
        if (error.response && error.response.data) {
          // If there's a specific error message from the API, use it
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
        
        // Return an empty array for this employee along with error info
        return { 
          employeeId, 
          records: [], 
          error: true,
          errorMessage,
          errorStatus: error.response ? error.response.status : null
        };
      }
    });
    
    // Wait for all promises to resolve
    const results = await Promise.all(attendancePromises);
    
    console.log('All attendance promises resolved:', results);
    
    // Convert the array of results to an object with employee IDs as keys
    const attendanceData = {};
    results.forEach(result => {
      console.log(`Processing result for employee ${result.employeeId}:`, result.records);
      attendanceData[result.employeeId] = result.records;
    });
    
    console.log('Final attendance data:', attendanceData);
    return attendanceData;
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
};

/**
 * Filter attendance data by period
 * @param {Object} attendanceData - Object with employee IDs as keys and arrays of attendance records as values
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {Object} - Filtered attendance data
 */
export const filterAttendanceByPeriod = (attendanceData, startDate, endDate) => {
  console.log('filterAttendanceByPeriod called with:', {
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : 'undefined',
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : 'undefined'
  });
  
  // Get the day and month components for comparison
  const startDay = startDate ? format(startDate, 'dd') : null;
  const startMonth = startDate ? format(startDate, 'MM') : null;
  const endDay = endDate ? format(endDate, 'dd') : null;
  const endMonth = endDate ? format(endDate, 'MM') : null;
  
  console.log(`Comparing by day/month: Start=${startDay}-${startMonth}, End=${endDay}-${endMonth}`);
  console.log('Attendance data to filter:', attendanceData);
  
  const filteredData = {};
  
  Object.keys(attendanceData).forEach(employeeId => {
    console.log(`Filtering records for employee ${employeeId}`);
    console.log(`Original records count: ${attendanceData[employeeId].length}`);
    
    filteredData[employeeId] = attendanceData[employeeId].filter(record => {
      try {
        if (!record.date) return false;
        
        // Parse the record date
        // Extract only the day and month for comparison, ignoring year differences
        const recordDateParts = record.date.split('-');
        if (recordDateParts.length < 3) return false;
        
        const recordDay = recordDateParts[2].slice(0, 2);
        const recordMonth = recordDateParts[1];
        
        // Compare day and month only, ignoring year
        let isInRange = false;
        
        // For single day comparison
        if (startMonth === endMonth && startDay === endDay) {
          isInRange = recordMonth === startMonth && recordDay === startDay;
        } 
        // For date range comparison
        else {
          // Create month-day strings for easy comparison
          const recordMonthDay = `${recordMonth}-${recordDay}`;
          const startMonthDay = `${startMonth}-${startDay}`;
          const endMonthDay = `${endMonth}-${endDay}`;
          
          // Check if month-day is in range
          isInRange = recordMonthDay >= startMonthDay && recordMonthDay <= endMonthDay;
        }
        
        console.log(`Record date: ${record.date}, Day: ${recordDay}, Month: ${recordMonth}, In range: ${isInRange}`);
        return isInRange;
      } catch (e) {
        console.error(`Error parsing date for record:`, record, e);
        return false;
      }
    });
    
    console.log(`Filtered records count: ${filteredData[employeeId].length}`);
  });
  
  console.log('Filtered attendance data:', filteredData);
  return filteredData;
};
