import { format, subDays, isWeekend as isWeekendFn, parseISO } from 'date-fns';
import axios from 'axios';
import { getAuthHeader, refreshAccessToken } from './authService';
import { processZohoAttendanceData } from './attendanceService';

// Base API URL - Using Vite proxy to avoid CORS issues
const API_BASE_URL = '/zoho-api/people/api';

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  // Ensure we're using the correct format: DD-MM-YYYY
  return format(date, 'dd-MM-yyyy');
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
  if (record.Status) {
    status = record.Status;
  } else if (checkInTime) {
    status = 'Present';
  }
  
  // Create a record object
  return {
    employeeId,
    date: dateKey,
    checkInTime,
    checkOutTime,
    workingHours: record.WorkingHours || record.TotalHours || '00:00',
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
 * Fetch attendance data for all employees for the past month
 * This function fetches data once and returns it in a format that can be filtered locally
 * @param {Array} employeeIds - Array of employee IDs to fetch attendance for
 * @returns {Object} - Object with employee IDs as keys and arrays of attendance records as values
 */
export const fetchMonthAttendance = async (employeeIds) => {
  // First, ensure we have a fresh token
  try {
    await refreshAccessToken();
  } catch (tokenError) {
    console.error('Error refreshing token:', tokenError);
  }
  
  // Get current date and format it correctly
  const today = new Date();
  
  // Calculate the start date (30 days ago)
  const startDate = subDays(today, 30); // Get data for the last 30 days
  
  // Use the exact date format that works in the direct URL
  const startDateStr = formatDateForZoho(startDate);
  const endDateStr = formatDateForZoho(today);
  
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
        
        // Make API request for employee with the date parameters
        
        const response = await axios.get(
          `${API_BASE_URL}/attendance/getUserReport`, {
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
              workingHours: '00:00',
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
              workingHours: '00:00',
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
          
          // Always ensure we have at least one record for today
          const todayStr = format(today, 'yyyy-MM-dd');
          const hasTodayRecord = processedRecords.some(record => record.date === todayStr);
          
          if (!hasTodayRecord) {
            const todayRecord = {
              employeeId,
              date: todayStr,
              checkInTime: null,
              checkOutTime: null,
              workingHours: '00:00',
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
            
            processedRecords.push(todayRecord);
          }
          
          return { employeeId, records: processedRecords };
        } else {
          console.log(`No recognized data format for employee ${employeeId}`);
          
          // Create a default record for today
          const todayFormatted = format(today, 'yyyy-MM-dd');
          const defaultRecord = {
            employeeId,
            date: todayFormatted,
            checkInTime: null,
            checkOutTime: null,
            workingHours: '00:00',
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
        
        // Always return the processed records, even if empty
        return { employeeId, records: processedRecords };
      } catch (error) {
        console.error(`Error fetching attendance for employee ${employeeId}:`, error);
        
        // Log more details about the error to help diagnose the issue
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Error request:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', error.message);
        }
        
        // Create a default record for today even in case of error
        const todayFormatted = format(today, 'yyyy-MM-dd');
        const defaultRecord = {
          employeeId,
          date: todayFormatted,
          checkInTime: null,
          checkOutTime: null,
          workingHours: '00:00',
          status: 'Yet to Check In', // Changed from 'Error Fetching Data' to be consistent with UI
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
        
        return { employeeId, records: [defaultRecord] };
      }
    });
    
    // Wait for all promises to resolve
    const results = await Promise.all(attendancePromises);
    
    // Convert array of results to an object keyed by employee ID
    const attendanceData = {};
    results.forEach(({ employeeId, records }) => {
      attendanceData[employeeId] = records;
    });
    
    console.log('Fetched month attendance data for all employees');
    return attendanceData;
  } catch (error) {
    console.error('Error fetching month attendance:', error);
    throw error;
  }
};

/**
 * Filter attendance data for a specific time period
 * @param {Object} allAttendanceData - Full attendance data object
 * @param {String} period - Period to filter for ('today', 'last3days', 'last7days', 'month')
 * @returns {Object} - Filtered attendance data
 */
export const filterAttendanceByPeriod = (allAttendanceData, period) => {
  if (!allAttendanceData) return {};
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  
  const filteredData = {};
  
  // Process each employee's data
  Object.keys(allAttendanceData).forEach(employeeId => {
    const employeeRecords = allAttendanceData[employeeId] || [];
    
    // Filter records based on the period
    let filteredRecords = [];
    
    if (period === 'today') {
      // Only include records from today
      filteredRecords = employeeRecords.filter(record => {
        if (!record.date) return false;
        
        try {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        } catch (e) {
          console.error(`Error parsing date: ${record.date}`, e);
          return false;
        }
      });
      
      // If no records for today, create a default one
      if (filteredRecords.length === 0 && employeeRecords.length > 0) {
        const todayFormatted = format(today, 'yyyy-MM-dd');
        const defaultRecord = {
          employeeId,
          date: todayFormatted,
          checkInTime: null,
          checkOutTime: null,
          workingHours: '00:00',
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
        
        filteredRecords = [defaultRecord];
      }
    } else if (period === 'last3days') {
      // Include records from the last 3 days
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 2); // -2 because today counts as 1
      
      filteredRecords = employeeRecords.filter(record => {
        if (!record.date) return false;
        
        try {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate >= threeDaysAgo;
        } catch (e) {
          console.error(`Error parsing date: ${record.date}`, e);
          return false;
        }
      });
    } else if (period === 'last7days') {
      // Include records from the last 7 days
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6); // -6 because today counts as 1
      
      filteredRecords = employeeRecords.filter(record => {
        if (!record.date) return false;
        
        try {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate >= sevenDaysAgo;
        } catch (e) {
          console.error(`Error parsing date: ${record.date}`, e);
          return false;
        }
      });
    } else if (period === 'month') {
      // Include all records (already filtered for the month)
      filteredRecords = employeeRecords;
    }
    
    // For today's view, ensure we always have at least one record
    if (period === 'today' && filteredRecords.length === 0) {
      const todayFormatted = format(today, 'yyyy-MM-dd');
      filteredRecords = [{
        employeeId,
        date: todayFormatted,
        checkInTime: null,
        checkOutTime: null,
        workingHours: '00:00',
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
      }];
    }
    
    // Add filtered records to the result
    filteredData[employeeId] = filteredRecords;
  });
  
  return filteredData;
};
