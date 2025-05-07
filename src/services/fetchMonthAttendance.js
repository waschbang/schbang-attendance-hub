import {
  format,
  subDays,
  isWeekend as isWeekendFn,
  parseISO,
  isSameDay,
  isBefore,
  isAfter,
} from "date-fns";
import axios from "axios";
import { getAuthHeader, refreshAccessToken } from "./authService";
import { processZohoAttendanceData } from "./attendanceService";
import { getApiUrl } from "../config/apiConfig";

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  try {
    // Always use the current date and month but with the current year
    const currentYear = new Date().getFullYear();

    // Extract day and month from the provided date
    const day = format(date, "dd");
    const month = format(date, "MM");

    // Construct the date string manually to ensure current year
    const formattedDate = `${day}-${month}-${currentYear}`;

    return formattedDate;
  } catch (error) {
    // Error formatting date for Zoho API
    // Fallback to current date with current year as a last resort
    const now = new Date();
    return format(now, "dd-MM-") + now.getFullYear();
  }
};

// Helper function to process a date record consistently
const processDateRecord = (record, dateKey, employeeId) => {
  // Extract check-in time
  let checkInTime = null;
  if (record.FirstIn && record.FirstIn !== "-") {
    // Try different regex patterns to extract time
    let match = record.FirstIn.match(
      /\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/
    );
    if (!match) {
      // Try alternative format
      const parts = record.FirstIn.split(" ");
      if (parts.length >= 3) {
        checkInTime = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
      }
    } else {
      checkInTime = match[1];
    }
  }

  // Extract check-out time
  let checkOutTime = null;
  if (record.LastOut && record.LastOut !== "-") {
    // Try different regex patterns to extract time
    let match = record.LastOut.match(
      /\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/
    );
    if (!match) {
      // Try alternative format
      const parts = record.LastOut.split(" ");
      if (parts.length >= 3) {
        checkOutTime = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
      }
    } else {
      checkOutTime = match[1];
    }
  }

  // Determine status
  let status = "Absent";

  // If check-in time exists, always mark as Present regardless of other status
  if (checkInTime) {
    status = "Present";
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
    isHoliday: status.toLowerCase().includes("holiday"),
    holidayName: status.toLowerCase().includes("holiday") ? status : "",
    isWeekend: isWeekendFn(new Date(dateKey)),
    isLeave: status.toLowerCase().includes("leave"),
    leaveType: status.toLowerCase().includes("leave") ? status : "",
    shiftName: record.ShiftName || "",
    shiftStartTime: record.ShiftStartTime || "",
    shiftEndTime: record.ShiftEndTime || "",
    location: record.FirstIn_Location || "",
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
export const fetchMonthAttendance = async (
  employeeIds,
  customStartDate,
  customEndDate
) => {
  // First, ensure we have a fresh token
  try {
    await refreshAccessToken();
  } catch (tokenError) {
    // Error refreshing token
  }

  let startDateStr, endDateStr;

  // If custom dates are provided, use them directly
  if (customStartDate && customEndDate) {
    startDateStr = customStartDate;
    endDateStr = customEndDate;
  } else {
    // Otherwise use the default 30 day range
    const today = new Date();
    const startDate = subDays(today, 30); // Get data for the last 30 days

    // Use the exact date format that works in the direct URL
    startDateStr = formatDateForZoho(startDate);
    endDateStr = formatDateForZoho(today);
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
          empId: employeeId,
        };

        // Check if we're in development or production mode
        const isDevelopment = import.meta.env.DEV;

        // In development, use the standard API URL
        // In production, use the serverless function with path parameter
        const apiUrl = isDevelopment
          ? getApiUrl("/attendance/getUserReport")
          : `${getApiUrl()}?path=attendance/getUserReport`;

        // Make API request for employee with the date parameters

        const response = await axios.get(apiUrl, {
          params: requestParams,
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        // Process the raw data
        const rawData = response.data;

        const processedRecords = [];

        // Check if we have direct date keys in the response (most common format)
        if (
          rawData &&
          typeof rawData === "object" &&
          !Array.isArray(rawData) &&
          Object.keys(rawData).length > 0
        ) {
          // Process each date's data directly from the raw data
          Object.keys(rawData).forEach((dateKey) => {
            const record = rawData[dateKey];
            if (record) {
              processedRecords.push(
                processDateRecord(record, dateKey, employeeId)
              );
            }
          });
        }
        // If data is in response.result format (alternative format)
        else if (rawData && rawData.response && rawData.response.result) {
          const dateData = rawData.response.result;

          // Check if there's any data
          if (Object.keys(dateData).length === 0) {
            // Create a default record for today
            const todayFormatted = format(today, "yyyy-MM-dd");
            const defaultRecord = {
              employeeId,
              date: todayFormatted,
              checkInTime: null,
              checkOutTime: null,
              status: "Yet to Check In",
              isHoliday: false,
              holidayName: "",
              isWeekend: isWeekendFn(today),
              isLeave: false,
              leaveType: "",
              shiftName: "",
              shiftStartTime: "",
              shiftEndTime: "",
              location: "",
            };

            processedRecords.push(defaultRecord);
            return { employeeId, records: processedRecords };
          }

          // Process each date's data
          Object.keys(dateData).forEach((dateKey) => {
            const record = dateData[dateKey];
            if (record) {
              processedRecords.push(
                processDateRecord(record, dateKey, employeeId)
              );
            }
          });

          // If we still don't have any records, create a default one for today
          if (processedRecords.length === 0) {
            const todayFormatted = format(today, "yyyy-MM-dd");
            const defaultRecord = {
              employeeId,
              date: todayFormatted,
              checkInTime: null,
              checkOutTime: null,
              status: "Yet to Check In",
              isHoliday: false,
              holidayName: "",
              isWeekend: isWeekendFn(today),
              isLeave: false,
              leaveType: "",
              shiftName: "",
              shiftStartTime: "",
              shiftEndTime: "",
              location: "",
            };

            processedRecords.push(defaultRecord);
          }
        }
        // If we couldn't find any data in the expected formats, create a default record
        else {
          const todayFormatted = format(today, "yyyy-MM-dd");
          const defaultRecord = {
            employeeId,
            date: todayFormatted,
            checkInTime: null,
            checkOutTime: null,
            status: "Yet to Check In",
            isHoliday: false,
            holidayName: "",
            isWeekend: isWeekendFn(today),
            isLeave: false,
            leaveType: "",
            shiftName: "",
            shiftStartTime: "",
            shiftEndTime: "",
            location: "",
          };

          processedRecords.push(defaultRecord);
        }

        return { employeeId, records: processedRecords };
      } catch (error) {
        // Error fetching attendance for employee
        return {
          employeeId,
          error: true,
          message: error.message || "Unknown error",
        };
      }
    });

    // Wait for all promises to resolve
    const results = await Promise.all(attendancePromises);

    // Process the results into a single object
    const attendanceData = {};

    results.forEach((result) => {
      if (!result.error) {
        attendanceData[result.employeeId] = result.records;
      }
    });

    return attendanceData;
  } catch (error) {
    // Error fetching attendance data
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
export const filterAttendanceByPeriod = (
  attendanceData,
  startDate,
  endDate
) => {
  if (!attendanceData || !startDate || !endDate) {
    return attendanceData;
  }

  // Ensure we have date objects
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const endDay = end.getDate();
  const endMonth = end.getMonth();

  // Create a new object to hold filtered data
  const filteredData = {};

  // Process each employee's data
  Object.keys(attendanceData).forEach((employeeId) => {
    filteredData[employeeId] = [];

    // Check if employee has any attendance records
    if (
      !attendanceData[employeeId] ||
      !Array.isArray(attendanceData[employeeId])
    ) {
      return;
    }

    // Filter records for this employee
    attendanceData[employeeId].forEach((record) => {
      try {
        if (!record.date) {
          return;
        }

        const recordDate =
          typeof record.date === "string" ? new Date(record.date) : record.date;
        const recordDay = recordDate.getDate();
        const recordMonth = recordDate.getMonth();

        // Check if the record date is within range
        // We're only checking day/month and not year because we're looking at the current year
        // and filtering visually by month
        let isInRange = false;

        // If start and end are in the same month
        if (startMonth === endMonth) {
          isInRange =
            recordMonth === startMonth &&
            recordDay >= startDay &&
            recordDay <= endDay;
        }
        // If start and end span different months
        else {
          isInRange =
            (recordMonth === startMonth && recordDay >= startDay) ||
            (recordMonth === endMonth && recordDay <= endDay) ||
            (recordMonth > startMonth && recordMonth < endMonth);
        }

        if (isInRange) {
          filteredData[employeeId].push(record);
        }
      } catch (e) {
        // Error parsing date for record
      }
    });
  });

  return filteredData;
};
