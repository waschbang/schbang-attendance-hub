import { subDays } from 'date-fns';
import { fetchRangeAttendance } from './attendanceService';

// Format date to DD-MM-YYYY format for Zoho API
const formatDateForZoho = (date) => {
  return format(date, 'dd-MM-yyyy');
};

// Get attendance data for all employees for a full month
export const fetchMonthAttendance = async (employeeIds) => {
  const today = new Date();
  const startDate = subDays(today, 30);
  try {
    const attendanceData = await fetchRangeAttendance(employeeIds, startDate, today);
    // Flatten all results into a single array of objects
    const allAttendance = [];
    Object.keys(attendanceData).forEach(employeeId => {
      const empData = attendanceData[employeeId];
      if (empData && typeof empData === 'object' && !Array.isArray(empData)) {
        Object.keys(empData).forEach(dateKey => {
          const record = empData[dateKey];
          allAttendance.push({
            employeeId,
            date: dateKey,
            checkInTime: record.FirstIn && record.FirstIn !== '-' ? (record.FirstIn.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/)?.[1] || null) : null,
            checkOutTime: record.LastOut && record.LastOut !== '-' ? (record.LastOut.match(/\d{2}-\d{2}-\d{4}\s+(\d{2}:\d{2}\s+[AP]M)/)?.[1] || null) : null,
            workingHours: record.WorkingHours || record.TotalHours || '00:00',
            status: record.Status || 'Absent',
            ...record
          });
        });
      }
    });
    console.log('All attendance records:', allAttendance);
    return allAttendance;
  } catch (error) {
    throw error;
  }
};
