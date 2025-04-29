import axios from 'axios';
import { format, subDays, parseISO, isWeekend as isWeekendFn } from 'date-fns';

// For testing and debugging
let testAttendanceData = null;

// Set test data for debugging
export const setTestAttendanceData = (data) => {
  console.log('Setting test attendance data');
  testAttendanceData = data;
  return testAttendanceData;
};

// Base API URL - Using Vite proxy to avoid CORS issues
const API_BASE_URL = '/zoho-api/people/api';

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  return format(date, 'dd-MM-yyyy');
};

// Get attendance data for a specific employee within a date range
export const fetchEmployeeAttendance = async (employeeId, startDate, endDate) => {
  try {
    console.log(`Fetching attendance for employee ${employeeId} from ${formatDateForZoho(startDate)} to ${formatDateForZoho(endDate)}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/attendance/getUserReport`, {
        params: {
          sdate: formatDateForZoho(startDate),
          edate: formatDateForZoho(endDate),
          empId: employeeId
        },
        headers: {
          'Authorization': `Bearer 1000.459c3138fd299954c2fdc55e418c9f0a.ccd75873ad6700311a5a2b08f1b88dbd`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Attendance API response:', response.data);
    
    const processedData = processZohoAttendanceData(response.data, startDate, endDate);
    console.log('Processed attendance data:', processedData);
    
    return processedData;
  } catch (error) {
    console.error(`Error fetching attendance data for employee ${employeeId}:`, error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Get attendance data for all employees for today
export const fetchTodayAttendance = async (employeeIds) => {
  const today = new Date();
  console.log(`Fetching today's attendance for ${employeeIds.length} employees`);
  
  try {
    // If we already have the data in the expected format (for testing)
    if (testAttendanceData) {
      console.log('Using test attendance data');
      return testAttendanceData;
    }
    
    const attendancePromises = employeeIds.map(id => 
      fetchEmployeeAttendance(id, today, today)
    );
    
    console.log(`Created ${attendancePromises.length} attendance fetch promises`);
    const attendanceResults = await Promise.allSettled(attendancePromises);
    
    // Process results, including handling of rejected promises
    const attendanceData = {};
    
    attendanceResults.forEach((result, index) => {
      const employeeId = employeeIds[index];
      
      if (result.status === 'fulfilled') {
        console.log(`Successfully fetched attendance for employee ${employeeId}`);
        // Check if the result is already in the expected format
        if (result.value && result.value.length > 0) {
          attendanceData[employeeId] = result.value[0] || null; // Get first (and only) day
        } else if (typeof result.value === 'object' && !Array.isArray(result.value)) {
          // Direct API response
          attendanceData[employeeId] = result.value;
        } else {
          attendanceData[employeeId] = null;
        }
      } else {
        console.error(`Failed to fetch attendance for employee ${employeeId}:`, result.reason);
        console.error('Error details:', result.reason.response ? result.reason.response.data : 'No response data');
        attendanceData[employeeId] = null; // Set null for failed requests
      }
    });
    
    console.log('Compiled attendance data for all employees:', attendanceData);
    return attendanceData;
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Get attendance data for all employees for the last N days
export const fetchLastNDaysAttendance = async (employeeIds, days) => {
  const today = new Date();
  const startDate = subDays(today, days - 1); // Subtract days-1 to include today
  
  try {
    console.log(`Fetching attendance for ${employeeIds.length} employees for the last ${days} days`);
    
    const attendancePromises = employeeIds.map(id => 
      fetchEmployeeAttendance(id, startDate, today)
    );
    
    console.log(`Created ${attendancePromises.length} attendance fetch promises`);
    const attendanceResults = await Promise.allSettled(attendancePromises);
    
    // Process results, including handling of rejected promises
    const attendanceData = {};
    
    attendanceResults.forEach((result, index) => {
      const employeeId = employeeIds[index];
      
      if (result.status === 'fulfilled') {
        console.log(`Successfully fetched attendance for employee ${employeeId}`);
        attendanceData[employeeId] = result.value;
      } else {
        console.error(`Failed to fetch attendance for employee ${employeeId}:`, result.reason);
        console.error('Error details:', result.reason.response ? result.reason.response.data : 'No response data');
        attendanceData[employeeId] = null; // Set null for failed requests
      }
    });
    
    console.log('Compiled attendance data for all employees:', attendanceData);
    return attendanceData;
  } catch (error) {
    console.error(`Error fetching attendance for the last ${days} days:`, error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Get attendance data for all employees for a specific date range
export const fetchRangeAttendance = async (employeeIds, startDate, endDate) => {
  console.log(`Fetching attendance for ${employeeIds.length} employees from ${formatDateForZoho(startDate)} to ${formatDateForZoho(endDate)}`);
  
  try {
    const attendancePromises = employeeIds.map(id => 
      fetchEmployeeAttendance(id, startDate, endDate)
    );
    
    console.log(`Created ${attendancePromises.length} attendance fetch promises for date range`);
    const attendanceResults = await Promise.allSettled(attendancePromises);
    
    // Process results, including handling of rejected promises
    const attendanceData = {};
    
    attendanceResults.forEach((result, index) => {
      const employeeId = employeeIds[index];
      
      if (result.status === 'fulfilled') {
        console.log(`Successfully fetched attendance for employee ${employeeId} for date range`);
        attendanceData[employeeId] = result.value || []; 
      } else {
        console.error(`Failed to fetch attendance for employee ${employeeId} for date range:`, result.reason);
        console.error('Error details:', result.reason.response ? result.reason.response.data : 'No response data');
        attendanceData[employeeId] = []; // Set empty array for failed requests
      }
    });
    
    console.log('Compiled attendance data for all employees for date range');
    return attendanceData;
  } catch (error) {
    console.error(`Error fetching attendance for date range ${startDate} to ${endDate}:`, error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Process the attendance data from Zoho API (original format)
const processZohoAttendanceData = (data, startDate, endDate) => {
  console.log('Processing Zoho attendance data for date range:', { startDate, endDate });
  
  if (!data) {
    console.warn('No attendance data received from Zoho API');
    return [];
  }
  
  console.log('Received data format:', data);
  
  // Check if data is already in the expected format (direct API response)
  // This happens when the data is directly from the API and not processed
  if (Object.keys(data).length > 0 && data[Object.keys(data)[0]] && 
      typeof data[Object.keys(data)[0]] === 'object' && 
      data[Object.keys(data)[0]].hasOwnProperty('date')) {
    console.log('Data is already in the expected format, returning as is');
    
    // Convert the object to an array format for consistency
    const resultArray = [];
    for (const empId in data) {
      if (data.hasOwnProperty(empId)) {
        // If it's a single day, wrap it in an array
        if (!Array.isArray(data[empId])) {
          resultArray.push(data[empId]);
        } else {
          // If it's already an array, add each item
          data[empId].forEach(day => resultArray.push(day));
        }
      }
    }
    return resultArray;
  }
  
  const result = [];
  const currentDate = new Date();
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  
  // Generate dates between start and end date
  let dateIterator = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  while (dateIterator <= endDateObj) {
    const dateStr = format(dateIterator, 'yyyy-MM-dd');
    const dateFormatted = format(dateIterator, 'dd-MM-yyyy');
    const dayData = data[dateStr] || data[dateFormatted];
    
    let status = 'Absent';
    let checkInTime = null;
    let checkOutTime = null;
    let workingHours = 0;
    let isHoliday = false;
    let isWeekendDay = isWeekendFn(dateIterator);
    let isLeave = false;
    let leaveType = '';
    let holidayName = '';
    
    if (dayData) {
      // Extract status
      if (dayData.Status) {
        if (dayData.Status.includes('Present')) {
          status = 'Present';
        } else if (dayData.Status.includes('Weekend')) {
          status = 'Weekend';
          isWeekendDay = true;
        } else if (dayData.Status.includes('Holiday')) {
          status = 'Holiday';
          isHoliday = true;
          holidayName = 'Holiday';
        } else if (dayData.Status.includes('Leave') || dayData.Status.includes('Off')) {
          status = dayData.Status;
          isLeave = true;
          leaveType = dayData.LeaveCode || 'Leave';
        } else if (dateStr === currentDateStr && !dayData.FirstIn) {
          // If it's today and no check-in yet
          const now = new Date();
          const checkInDeadline = new Date(now);
          checkInDeadline.setHours(10, 30, 0);
          
          if (now < checkInDeadline) {
            status = 'Yet to Check In';
          }
        }
      }
      
      // Extract check-in and check-out times
      if (dayData.FirstIn && dayData.FirstIn !== '-') {
        // Format: "21-04-2025 10:20 AM"
        const timeMatch = dayData.FirstIn.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/);
        if (timeMatch && timeMatch[1]) {
          checkInTime = timeMatch[1];
        }
      }
      
      if (dayData.LastOut && dayData.LastOut !== '-') {
        const timeMatch = dayData.LastOut.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/);
        if (timeMatch && timeMatch[1]) {
          checkOutTime = timeMatch[1];
        }
      }
      
      // Get working hours
      if (dayData.TotalHours && dayData.TotalHours !== '00:00') {
        // Convert HH:MM format to decimal hours
        const [hours, minutes] = dayData.TotalHours.split(':');
        workingHours = (parseFloat(hours) + parseFloat(minutes) / 60).toFixed(2);
      }
    } else if (dateStr === currentDateStr) {
      // If it's today and no data yet
      const now = new Date();
      const checkInDeadline = new Date(now);
      checkInDeadline.setHours(10, 30, 0);
      
      if (now < checkInDeadline) {
        status = 'Yet to Check In';
      }
    }
    
    result.push({
      date: format(dateIterator, 'dd-MM-yyyy'),
      checkInTime,
      checkOutTime,
      workingHours,
      status,
      isHoliday,
      holidayName,
      isWeekend: isWeekendDay,
      isLeave,
      leaveType,
      rawData: dayData || null
    });
    
    // Move to next day
    dateIterator.setDate(dateIterator.getDate() + 1);
  }
  
  return result;
};

// Helper function to determine current attendance status based on time
export const getCurrentAttendanceStatus = (checkInTime) => {
  const now = new Date();
  const checkInDeadline = new Date(now);
  checkInDeadline.setHours(10, 30, 0);
  
  if (checkInTime) {
    return 'Present';
  } else if (now < checkInDeadline) {
    return 'Yet to Check In';
  } else {
    return 'Absent';
  }
};

// Convert 12-hour format time to 24-hour format
export const convertTo24Hour = (time12h) => {
  if (!time12h || time12h === 'N/A' || time12h === '-') return null;
  
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${hours}:${minutes}`;
};

// Format time for display (12-hour format)
export const formatTimeForDisplay = (time) => {
  if (!time || time === 'N/A' || time === '-') return 'N/A';
  
  // If already in 12-hour format with AM/PM
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // If in 24-hour format
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch (error) {
    return time;
  }
};
