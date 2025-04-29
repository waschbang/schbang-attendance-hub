import axios from 'axios';
import { format, subDays, parseISO, isWeekend as isWeekendFn } from 'date-fns';

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
    const attendancePromises = employeeIds.map(id => 
      fetchEmployeeAttendance(id, today, today)
        .then(data => {
          // Process the raw Zoho data into our expected format
          const processedData = processZohoAttendanceData(data, id);
          return { id, data: processedData };
        })
        .catch(error => {
          console.error(`Error fetching attendance for employee ${id}:`, error);
          return { id, data: null };
        })
    );
    
    const attendanceResults = await Promise.all(attendancePromises);
    
    // Process the results into a map of employee ID to attendance data
    const attendanceMap = {};
    
    attendanceResults.forEach(({ id, data }) => {
      if (data) {
        attendanceMap[id] = data;
      }
    });
    
    console.log('Compiled attendance data for all employees:', attendanceMap);
    return attendanceMap;
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

// Process the raw Zoho attendance data into a more usable format
export const processZohoAttendanceData = (data, employeeId) => {
  console.log(`Processing Zoho attendance data for employee ID: ${employeeId}`, data);
  
  // Handle the case where the data is wrapped in a response object
  if (data && data.response && data.response.result) {
    data = data.response.result;
    console.log('Extracted data from response.result', data);
  }
  
  // If no records found or empty data
  if (!data || !data.length || data.length === 0) {
    console.log('No attendance records found, returning default absent data');
    return {
      date: format(new Date(), 'dd-MM-yyyy'),
      checkInTime: null,
      checkOutTime: null,
      workingHours: '0.00',
      status: 'Absent',
      isHoliday: false,
      holidayName: '',
      isWeekend: isWeekendFn(new Date()),
      isLeave: false,
      leaveType: ''
    };
  }
  
  // Get the first record (most recent)
  const record = data[0];
  console.log('Processing record:', record);
  
  // Extract date from FirstIn or use current date
  let dateStr = '';
  let dateObj = new Date();
  
  if (record.FirstIn && record.FirstIn !== '-') {
    // Try to extract date from FirstIn (format: DD-MM-YYYY HH:MM AM/PM)
    const dateTimeParts = record.FirstIn.split(' ');
    if (dateTimeParts.length >= 1) {
      dateStr = dateTimeParts[0];
      // Try to parse the date
      try {
        // Check if date is in DD-MM-YYYY format
        if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateStr.split('-');
          dateObj = new Date(year, month - 1, day);
        } else {
          // Assume it's in YYYY-MM-DD format
          dateObj = parseISO(dateStr);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        // Use current date as fallback
        dateObj = new Date();
      }
    }
  }
  
  // Format the date as DD-MM-YYYY
  dateStr = format(dateObj, 'dd-MM-yyyy');
  
  // Extract check-in time from FirstIn
  let checkInTime = null;
  if (record.FirstIn && record.FirstIn !== '-') {
    const timeMatch = record.FirstIn.match(/\d{2}:\d{2}\s*[AP]M/i);
    if (timeMatch) {
      checkInTime = timeMatch[0];
    }
  }
  
  // Extract check-out time from LastOut
  let checkOutTime = null;
  if (record.LastOut && record.LastOut !== '-') {
    const timeMatch = record.LastOut.match(/\d{2}:\d{2}\s*[AP]M/i);
    if (timeMatch) {
      checkOutTime = timeMatch[0];
    }
  }
  
  // Determine status
  let status = 'Absent';
  if (record.Status) {
    status = record.Status;
  } else if (checkInTime) {
    status = 'Present';
  }
  
  // Process working hours
  let workingHours = '0.00';
  if (record.WorkingHours && record.WorkingHours !== '-') {
    workingHours = record.WorkingHours;
  } else if (record.TotalHours && record.TotalHours !== '-') {
    workingHours = record.TotalHours;
  }
  
  // Create the processed record
  const processedRecord = {
    date: dateStr,
    checkInTime,
    checkOutTime,
    workingHours,
    status,
    isHoliday: false, // We don't have this info from the API
    holidayName: '',
    isWeekend: isWeekendFn(dateObj),
    isLeave: status.toLowerCase().includes('leave'),
    leaveType: status.toLowerCase().includes('leave') ? status : '',
    rawData: record // Keep the original data for reference
  };
  
  console.log('Processed record:', processedRecord);
  return processedRecord;
};

// Process the attendance data from the API
export const processAttendanceData = (data, startDate, endDate) => {
  console.log('Processing attendance data', { data, startDate, endDate });
  
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
