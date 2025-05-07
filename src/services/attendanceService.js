import axios from "axios";
import { format, subDays, parseISO, isWeekend as isWeekendFn } from "date-fns";
import { getAuthHeader } from "./authService";
import { getApiUrl } from "../config/apiConfig";

// Base API URL - Using Vite proxy to avoid CORS issues
const API_BASE_URL = "/zoho-api/people/api";

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  const formattedDate = format(date, "dd-MM-yyyy");
  return formattedDate;
};

// Get attendance data for a specific employee within a date range
export const fetchEmployeeAttendance = async (
  employeeId,
  startDate,
  endDate
) => {
  try {
    const authHeader = await getAuthHeader();

    // Format dates for Zoho API
    const formattedStartDate = formatDateForZoho(startDate);
    const formattedEndDate = formatDateForZoho(endDate);

    // Make the API request
    const response = await axios.get(
      `${getApiUrl()}/attendance/getUserReport`,
      {
        params: {
          sdate: formattedStartDate,
          edate: formattedEndDate,
          empId: employeeId,
        },
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    // Process the data
    const processedData = processAttendanceData(
      response.data,
      startDate,
      endDate
    );

    return processedData;
  } catch (error) {
    throw error;
  }
};

// Get attendance data for all employees for today
export const fetchTodayAttendance = async (employeeIds) => {
  const today = new Date();

  try {
    // Create an array of promises to fetch attendance for each employee
    const attendancePromises = employeeIds.map((id) => {
      return fetchEmployeeAttendance(id, today, today).catch((error) => {
        return { id, error: true, message: error.message };
      });
    });

    // Wait for all promises to resolve
    const results = await Promise.all(attendancePromises);

    // Process the results into a single object with employee IDs as keys
    const attendanceMap = {};

    results.forEach((result) => {
      if (!result.error) {
        attendanceMap[result.employeeId] = result;
      }
    });

    return attendanceMap;
  } catch (error) {
    throw error;
  }
};

// Get attendance data for all employees for the last N days
export const fetchLastNDaysAttendance = async (employeeIds, days) => {
  const today = new Date();
  const startDate = subDays(today, days - 1); // Subtract days-1 to include today

  try {
    // Create an array of promises to fetch attendance for each employee
    const attendancePromises = employeeIds.map((employeeId) => {
      return fetchEmployeeAttendance(employeeId, startDate, today);
    });

    // Wait for all promises to resolve
    const results = await Promise.allSettled(attendancePromises);

    // Process the results into a single object with employee IDs as keys
    const attendanceData = {};

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const employeeId = result.value.employeeId;
        attendanceData[employeeId] = result.value;
      } else if (result.status === "rejected") {
        // Handle failed requests
      }
    });

    return attendanceData;
  } catch (error) {
    throw error;
  }
};

// Get attendance data for all employees for a specific date range
export const fetchRangeAttendance = async (employeeIds, startDate, endDate) => {
  try {
    // Create an array of promises to fetch attendance for each employee
    const attendancePromises = employeeIds.map((employeeId) => {
      return fetchEmployeeAttendance(employeeId, startDate, endDate);
    });

    // Wait for all promises to resolve
    const results = await Promise.allSettled(attendancePromises);

    // Process the results into a single object with employee IDs as keys
    const attendanceData = {};

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const employeeId = result.value.employeeId;
        attendanceData[employeeId] = result.value;
      } else if (result.status === "rejected") {
        // Handle failed requests
      }
    });

    return attendanceData;
  } catch (error) {
    throw error;
  }
};

// Process the raw Zoho attendance data into a more usable format
export const processZohoAttendanceData = (data, employeeId) => {
  if (!data) {
    return null;
  }

  // If it's already in our expected format, return it as is
  if (data.employeeId && Array.isArray(data.dailyRecords)) {
    return data;
  }

  // Handle the case where data is a map of date -> record
  const result = {
    employeeId: employeeId,
    dailyRecords: [],
  };

  // Check if data is an object with date keys
  if (typeof data === "object" && !Array.isArray(data)) {
    // Convert the object with date keys to an array of records
    Object.keys(data).forEach((dateKey) => {
      const record = data[dateKey];

      // Extract status
      let status = "Absent";
      if (record.Status) {
        status = record.Status;
      } else if (record.FirstIn && record.FirstIn !== "-") {
        status = "Present";
      }

      const processedRecord = {
        date: dateKey,
        status: status,
        checkInTime:
          record.FirstIn && record.FirstIn !== "-" ? record.FirstIn : null,
        checkOutTime:
          record.LastOut && record.LastOut !== "-" ? record.LastOut : null,
        // Add more fields as needed
      };

      result.dailyRecords.push(processedRecord);
    });
  }

  return result;
};

// Process the attendance data from the API
export const processAttendanceData = (data, startDate, endDate) => {
  // If no data was returned, handle gracefully
  if (!data) {
    return { employeeId: null, dailyRecords: [] };
  }

  // Check if the data is already in the expected format
  if (data.employeeId && Array.isArray(data.dailyRecords)) {
    return data;
  }

  // Process into the standardized format
  // Implementation depends on the actual format of the data
  // This is a placeholder - you'll need to adapt to your API response format

  return data;
};

// Helper function to determine current attendance status based on time
export const getCurrentAttendanceStatus = (checkInTime) => {
  const now = new Date();
  const checkInDeadline = new Date(now);
  checkInDeadline.setHours(10, 30, 0);

  if (checkInTime) {
    return "Present";
  } else if (now < checkInDeadline) {
    return "Yet to Check In";
  } else {
    return "Absent";
  }
};

// Convert 12-hour format time to 24-hour format
export const convertTo24Hour = (time12h) => {
  if (!time12h || time12h === "N/A" || time12h === "-") return null;

  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};

// Format time for display (12-hour format)
export const formatTimeForDisplay = (time) => {
  if (!time || time === "N/A" || time === "-") return "N/A";

  // If already in 12-hour format with AM/PM
  if (time.includes("AM") || time.includes("PM")) {
    return time;
  }

  // If in 24-hour format
  try {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${ampm}`;
  } catch (error) {
    return time;
  }
};
