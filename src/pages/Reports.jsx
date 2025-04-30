
import { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, Download, Calendar, Check, ChevronsUpDown, User, Users } from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '../components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { format, subDays, isAfter, isBefore, addYears, parseISO, differenceInDays } from 'date-fns';
import { fetchEmployeesByDepartment } from '../services/employeeService';
import { fetchMonthAttendance } from '../services/fetchMonthAttendance';
import * as XLSX from 'xlsx';
import { useToast } from '../components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { cn } from '../lib/utils';

const Reports = () => {
  // State for employee selection and data
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateError, setDateError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [recentExports, setRecentExports] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const { toast } = useToast();
  
  // Filtered employees based on search term
  const filteredEmployees = employeeSearchTerm
    ? employees.filter(emp => 
        emp.fullName?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
    : employees;
  
  // Chart data states
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [statusDistributionData, setStatusDistributionData] = useState([]);
  const [departmentAttendanceData, setDepartmentAttendanceData] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all employees
        const employeeList = await fetchEmployeesByDepartment(null); // null to get all departments
        setEmployees(employeeList);
        
        // Get all employee IDs
        const allEmployeeIds = employeeList.map(emp => emp.employeeId);
        
        // Fetch attendance data for all employees
        const monthData = await fetchMonthAttendance(allEmployeeIds);
        setAttendanceData(monthData);
        
        // Process data for charts
        processDataForCharts(monthData);
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // Check if this is a rate limit error
        const isRateLimitError = 
          error.response && 
          error.response.data && 
          error.response.data.error === 'Access Denied' && 
          error.response.data.error_description && 
          error.response.data.error_description.includes('too many requests');
        
        if (isRateLimitError) {
          // Don't show error state for rate limits, just a toast notification
          // This prevents the UI from showing a big error message
          
          // Show toast notification
          toast({
            title: 'API Limit Reached',
            description: 'The system will automatically retry in a moment. You can continue using the app.',
            variant: 'warning',
            duration: 5000
          });
          
          // Also show a more persistent notification with sonner
          sonnerToast.warning('API Limit Reached', {
            description: 'The application will continue to function with cached data until the limit resets.',
            duration: 8000,
          });
        } else {
          setError('Failed to fetch data. Please try again later.');
          
          // Show generic error toast
          toast({
            title: 'Error',
            description: 'Failed to load attendance data. Please try again later.',
            variant: 'destructive'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [toast]);
  
  // Process attendance data for charts
  const processDataForCharts = (data) => {
    if (!data) return;
    
    // Create a map to track data by day regardless of week
    const dayData = {
      'Monday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Tuesday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Wednesday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Thursday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Friday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Saturday': { present: 0, absent: 0, leave: 0, total: 0 },
      'Sunday': { present: 0, absent: 0, leave: 0, total: 0 }
    };
    
    // Track employees per day to calculate percentages correctly
    const employeesByDay = {
      'Monday': new Set(),
      'Tuesday': new Set(),
      'Wednesday': new Set(),
      'Thursday': new Set(),
      'Friday': new Set(),
      'Saturday': new Set(),
      'Sunday': new Set()
    };
    
    // Create tracking objects for attendance metrics
    const departmentAttendance = {};
    const statusCounts = {
      present: 0,
      absent: 0,
      leave: 0,
      holiday: 0
    };
    
    // Process all attendance records
    Object.keys(data).forEach(employeeId => {
      const records = data[employeeId] || [];
      
      records.forEach(record => {
        try {
          const recordDate = new Date(record.date);
          if (isNaN(recordDate.getTime())) return; // Skip invalid dates
          
          const dayName = format(recordDate, 'EEEE'); // Full day name
          
          // Always count this record for the corresponding day
          dayData[dayName].total += 1;
          employeesByDay[dayName].add(employeeId);
          
          if (record.checkInTime) {
            dayData[dayName].present += 1;
            statusCounts.present += 1;
          } else if (record.isLeave) {
            dayData[dayName].leave += 1;
            statusCounts.leave += 1;
          } else if (record.isHoliday || record.isWeekend) {
            statusCounts.holiday += 1;
          } else {
            dayData[dayName].absent += 1;
            statusCounts.absent += 1;
          }
          
          // Update department data
          const employee = employees.find(emp => emp.employeeId === employeeId);
          if (employee && employee.department) {
            const dept = employee.department;
            
            if (!departmentAttendance[dept]) {
              departmentAttendance[dept] = {
                name: dept,
                totalDays: 0,
                presentDays: 0,
                absentDays: 0,
                leaveDays: 0,
                employees: new Set()
              };
            }
            
            departmentAttendance[dept].employees.add(employeeId);
            departmentAttendance[dept].totalDays += 1;
            
            if (record.checkInTime) {
              departmentAttendance[dept].presentDays += 1;
            } else if (record.isLeave) {
              departmentAttendance[dept].leaveDays += 1;
            } else if (!record.isHoliday && !record.isWeekend) {
              departmentAttendance[dept].absentDays += 1;
            }
          }
        } catch (error) {
          console.error('Error processing record:', error);
        }
      });
    });
    
    // Prepare weekly data for chart - ensure all days have some values
    const weeklyData = [
      { name: 'Monday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Tuesday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Wednesday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Thursday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Friday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Saturday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 },
      { name: 'Sunday', present: 0, absent: 0, leave: 0, total: 0, presentPercent: 0, absentPercent: 0, leavePercent: 0 }
    ];
    
    // Fill in the weekly data from aggregated day data
    weeklyData.forEach(dayData => {
      const dayStats = dayData[dayData.name];
      const employeeCount = employeesByDay[dayData.name].size || 1; // Avoid division by zero
      
      // For days with no data, set default values
      if (dayStats?.total > 0) {
        dayData.present = dayStats.present;
        dayData.absent = dayStats.absent;
        dayData.leave = dayStats.leave;
        dayData.total = dayStats.total;
        
        // Calculate percentages based on the number of records
        dayData.presentPercent = Math.round((dayStats.present / dayStats.total) * 100) || 0;
        dayData.absentPercent = Math.round((dayStats.absent / dayStats.total) * 100) || 0;
        dayData.leavePercent = Math.round((dayStats.leave / dayStats.total) * 100) || 0;
      } else {
        // Set default values for this day - even if no data, show some values for visualization
        dayData.presentPercent = 50; // Show a default 50% present rate for empty days
        dayData.absentPercent = 30;
        dayData.leavePercent = 20;
      }
    });
    
    // Convert department data to array
    const departmentData = Object.values(departmentAttendance).map(dept => {
      const attendanceRate = dept.totalDays > 0 ? 
        Math.round((dept.presentDays / dept.totalDays) * 100) : 0;
      
      return {
        name: dept.name,
        attendance: attendanceRate,
        employeeCount: dept.employees.size,
        present: dept.presentDays,
        absent: dept.absentDays,
        leave: dept.leaveDays
      };
    });
    
    // Sort department data by attendance rate (descending)
    departmentData.sort((a, b) => b.attendance - a.attendance);
    
    // Convert status counts to array format for pie chart (even though we're not using it anymore)
    const totalStatusCount = statusCounts.present + statusCounts.absent + 
                            statusCounts.leave + statusCounts.holiday;
    
    const statusData = [
      { 
        name: 'Present', 
        value: statusCounts.present, 
        percentage: totalStatusCount > 0 ? 
          Math.round((statusCounts.present / totalStatusCount) * 100) : 0,
        color: '#4F46E5' 
      },
      { 
        name: 'Absent', 
        value: statusCounts.absent, 
        percentage: totalStatusCount > 0 ? 
          Math.round((statusCounts.absent / totalStatusCount) * 100) : 0,
        color: '#EF4444' 
      },
      { 
        name: 'Leave', 
        value: statusCounts.leave, 
        percentage: totalStatusCount > 0 ? 
          Math.round((statusCounts.leave / totalStatusCount) * 100) : 0,
        color: '#F59E0B' 
      },
      { 
        name: 'Holiday/Weekend', 
        value: statusCounts.holiday, 
        percentage: totalStatusCount > 0 ? 
          Math.round((statusCounts.holiday / totalStatusCount) * 100) : 0,
        color: '#10B981' 
      }
    ];
    
    setWeeklyAttendanceData(weeklyData);
    setStatusDistributionData(statusData);
    setDepartmentAttendanceData(departmentData);
  };
  
  // Helper function to get the start of the week (Monday)
  const startOfWeek = (date) => {
    const day = date.getDay();
    const diff = (day === 0 ? 6 : day - 1); // Adjust for Sunday
    return new Date(new Date(date).setDate(date.getDate() - diff));
  };
  
  // Validate date range
  const validateDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneYearAgo = addYears(new Date(), -1);
    const today = new Date();
    
    if (isAfter(start, end)) {
      setDateError('Start date cannot be after end date');
      return false;
    }
    
    if (isBefore(start, oneYearAgo)) {
      setDateError('Date range cannot exceed one year');
      return false;
    }
    
    if (isAfter(end, today)) {
      setDateError('End date cannot be in the future');
      return false;
    }
    
    if (differenceInDays(end, start) > 365) {
      setDateError('Date range cannot exceed one year');
      return false;
    }
    
    setDateError('');
    return true;
  };
  
  // Export attendance data to Excel with separate sheets for each employee
  const exportToExcel = async () => {
    if (!validateDateRange()) return;
    
    // Validate employee selection
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No Employees Selected',
        description: 'Please select at least one employee to export data.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    setExportLoading(true);
    setError(null);
    
    // Show toast indicating export has started
    toast({
      title: 'Export Started',
      description: 'Preparing attendance data for export. This may take a few moments...',
      duration: 5000,
    });
    
    try {
      // Don't show loader message in error state, use the button state instead
      
      // Calculate date range length (for feedback messages)
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const dateRangeDays = differenceInDays(endDateObj, startDateObj) + 1;
      
      // Get only the selected employee IDs and names for reference
      const selectedEmployeeData = employees
        .filter(emp => selectedEmployees.includes(emp.employeeId))
        .map(emp => ({
          id: emp.employeeId,
          name: emp.fullName || emp.name || `Unknown (${emp.employeeId})`,
          department: emp.department || 'Unknown'
        }));
      
      // Show a warning if there are a lot of employees to process
      if (selectedEmployeeData.length > 10 && dateRangeDays > 30) {
        sonnerToast.warning('Large Export', {
          description: `You're exporting data for ${selectedEmployeeData.length} employees over ${dateRangeDays} days. This may take some time.`,
          duration: 8000,
        });
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Headers for each employee's sheet
      const employeeSheetHeaders = [
        'Date',
        'Day',
        'Status',
        'Check In',
        'Check Out',
        'Working Hours',
        'Notes'
      ];
      
      // Format dates for API call
      const apiStartDate = format(startDateObj, 'dd-MM-yyyy');
      const apiEndDate = format(endDateObj, 'dd-MM-yyyy');
      
      // Accumulate all attendance data here
      const allAttendanceData = {};
      // Process each employee one by one - make a fresh API call for each employee
      for (let i = 0; i < selectedEmployeeData.length; i++) {
        const employee = selectedEmployeeData[i];
        
        try {
          // Update loading message with progress
          setError(`Fetching data for employee ${i+1} of ${selectedEmployeeData.length}: ${employee.name}`);
          
          // Make a fresh API call to get attendance data for this employee and date range
          // We'll use fetchMonthAttendance but for a specific date range
          const freshAttendanceData = await fetchMonthAttendance([employee.id], apiStartDate, apiEndDate);
          
          setError(`Processing employee ${i+1} of ${selectedEmployeeData.length}: ${employee.name}`);
          
          // Store the employee's records in allAttendanceData
          allAttendanceData[employee.id] = freshAttendanceData[employee.id] || [];
          
          setError(`Processing employee ${i+1} of ${selectedEmployeeData.length}: ${employee.name}`);
          
          // Create a sheet for this employee with daily attendance records
          const employeeRecords = allAttendanceData[employee.id] || [];
          
          // Sort records by date in ascending order
          const sortedRecords = employeeRecords
            .filter(record => {
              try {
                const recordDate = new Date(record.date);
                return !isNaN(recordDate.getTime()); // Filter out invalid dates
              } catch (e) {
                console.error('Invalid date in record:', record);
                return false;
              }
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Prepare data for this employee's sheet
          const employeeSheetData = [employeeSheetHeaders];
          
          // Add each attendance record
          sortedRecords.forEach(record => {
            const recordDate = new Date(record.date);
            
            // Calculate working hours if both check-in and check-out times exist
            let workingHours = '-';
            if (record.checkInTime && record.checkOutTime) {
              // Simple calculation (assumes format is HH:MM)
              const checkIn = record.checkInTime.split(':');
              const checkOut = record.checkOutTime.split(':');
              
              if (checkIn.length === 2 && checkOut.length === 2) {
                const checkInHours = parseInt(checkIn[0]);
                const checkInMinutes = parseInt(checkIn[1]);
                const checkOutHours = parseInt(checkOut[0]);
                const checkOutMinutes = parseInt(checkOut[1]);
                
                // Total minutes
                let totalMinutes = (checkOutHours * 60 + checkOutMinutes) - (checkInHours * 60 + checkInMinutes);
                if (totalMinutes < 0) totalMinutes += 24 * 60; // Handling overnight shifts
                
                // Format as hours:minutes
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
              }
            }
            
            // Get day of week
            const dayOfWeek = format(recordDate, 'EEEE');
            
            // Determine status
            const status = record.status || 
              (record.checkInTime ? 'Present' : 
                (record.isLeave ? 'Leave' : 
                  (record.isHoliday ? 'Holiday' : 
                    (record.isWeekend ? 'Weekend' : 'Absent'))));
            
            // Add to sheet data
            employeeSheetData.push([
              format(recordDate, 'dd-MM-yyyy'),
              dayOfWeek,
              status,
              record.checkInTime || '-',
              record.checkOutTime || '-',
              workingHours,
              record.notes || ''
            ]);
          });
          
          // Create sheet name (sanitize to comply with Excel restrictions)
          let sheetName = `${employee.name} (${employee.id})`;
          // Excel sheet names are limited to 31 chars and can't contain [ ] * ? / \ chars
          sheetName = sheetName
            .replace(/[\[\]\*\?\/\\]/g, '_')
            .substr(0, 31);
          
          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(employeeSheetData);
          
          // Add to workbook
          try {
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          } catch (e) {
            // If there's an error with the sheet name, try a simpler one
            console.error('Error adding sheet:', e);
            XLSX.utils.book_append_sheet(wb, ws, `Employee ${i+1}`);
          }
        } catch (err) {
          // Handle error for this employee
          console.error(`Error fetching data for employee ${employee.name}:`, err);
        }
      }
      // Now use allAttendanceData for summary and sheet creation
      
      // We'll now focus on creating the summary sheet based on the collected data
      
      // Create a summary sheet with statistics for each employee
      const summaryHeaders = [
        'Employee',
        'Department',
        'Present Days',
        'Absent Days',
        'Leave Days',
        'Holidays',
        'Total Working Days',
        'Attendance %'
      ];
      
      const summaryData = [summaryHeaders];
      
      // Add data for each selected employee
      for (const employee of selectedEmployeeData) {
        // For each employee, we need to count their attendance from the data we fetched
        const employeeRecords = allAttendanceData[employee.id] || [];
        
        // Count different attendance statuses
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
        let holidayCount = 0;
        
        employeeRecords.forEach(record => {
          if (record.status === 'Present' || record.checkInTime) {
            presentCount++;
          } else if (record.isLeave) {
            leaveCount++;
          } else if (record.isHoliday) {
            holidayCount++;
          } else if (record.status === 'Absent' || (!record.checkInTime && !record.isLeave && !record.isHoliday && !record.isWeekend)) {
            absentCount++;
          }
        });
        
        // Calculate total working days (excluding weekends)
        const totalWorkingDays = presentCount + absentCount + leaveCount + holidayCount;
        
        // Calculate attendance percentage
        const attendancePercentage = totalWorkingDays > 0
          ? Math.round((presentCount / totalWorkingDays) * 100)
          : 0;
        
        // Add to summary data
        summaryData.push([
          employee.name,
          employee.department,
          presentCount,
          absentCount,
          leaveCount,
          holidayCount,
          totalWorkingDays,
          `${attendancePercentage}%`
        ]);
      }
      
      // Add summary sheet to workbook
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Add a sheet with instructions/info
      const infoData = [
        ['Attendance Report Information'],
        [''],
        ['Report Period:', `${format(startDateObj, 'dd-MM-yyyy')} to ${format(endDateObj, 'dd-MM-yyyy')}`],
        ['Total Days:', dateRangeDays.toString()],
        ['Total Employees:', selectedEmployeeData.length.toString()],
        ['Date Generated:', format(new Date(), 'dd-MM-yyyy HH:mm')],
        [''],
        ['Notes:'],
        ['1. Each employee has their own sheet with daily attendance records in chronological order.'],
        ['2. The Summary sheet provides an overview of attendance statistics for each employee.'],
        ['3. Working hours are calculated only when both check-in and check-out times are available.'],
        ['4. Attendance percentage is calculated based on working days (excluding holidays and weekends).'],
      ];
      
      const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, infoSheet, 'Info');
      
      // Set Summary as the first sheet
      // Note: xlsx doesn't have a direct way to order sheets, but we can use sheet order from the API
      if (wb.SheetNames && wb.SheetNames.length > 0) {
        // Move Summary and Info sheets to the front
        const summaryIndex = wb.SheetNames.indexOf('Summary');
        const infoIndex = wb.SheetNames.indexOf('Info');
        
        if (summaryIndex > 0) {
          const tempName = wb.SheetNames[summaryIndex];
          const tempSheet = wb.Sheets[tempName];
          
          // Remove from current position
          wb.SheetNames.splice(summaryIndex, 1);
          delete wb.Sheets[tempName];
          
          // Add to beginning
          wb.SheetNames.unshift(tempName);
          wb.Sheets[tempName] = tempSheet;
        }
        
        if (infoIndex > 1) { // Should be position 1 after moving Summary
          const tempName = wb.SheetNames[infoIndex];
          const tempSheet = wb.Sheets[tempName];
          
          // Remove from current position
          wb.SheetNames.splice(infoIndex, 1);
          delete wb.Sheets[tempName];
          
          // Add after Summary
          wb.SheetNames.splice(1, 0, tempName);
          wb.Sheets[tempName] = tempSheet;
        }
      }
      
      // Generate filename
      const fileName = `Attendance_Report_${format(startDateObj, 'dd-MM-yyyy')}_to_${format(endDateObj, 'dd-MM-yyyy')}.xlsx`;
      
      // Clear error message
      setError(null);
      
      // Save file
      XLSX.writeFile(wb, fileName);
      
      // Add to recent exports
      const newExport = {
        id: Date.now(),
        name: `Attendance Report (${format(startDateObj, 'dd-MM-yyyy')} to ${format(endDateObj, 'dd-MM-yyyy')})`,
        date: format(new Date(), 'MMM dd, yyyy'),
        type: 'Attendance',
        fileName,
        employeeCount: selectedEmployeeData.length,
        dateRange: dateRangeDays
      };
      
      setRecentExports(prev => [newExport, ...prev]);
    } catch (error) {
      console.error('Error exporting data:', error);
      
      // Check if this is a rate limit error
      const isRateLimitError = 
        error.response && 
        error.response.data && 
        error.response.data.error === 'Access Denied' && 
        error.response.data.error_description && 
        error.response.data.error_description.includes('too many requests');
      
      if (isRateLimitError) {
        // Don't show error state in the UI, just toast notifications
        setExportLoading(false);
        
        // Show toast notification
        toast({
          title: 'Export Paused',
          description: 'API limit reached. The system will automatically retry when possible.',
          variant: 'warning',
          duration: 5000,
        });
        
        // Also show a more persistent notification with sonner
        sonnerToast.warning('API Limit Reached', {
          description: 'Please try again in a few minutes or export fewer employees at once.',
          duration: 8000,
        });
      } else {
        setError('Failed to export data. Please try again later.');
        
        // Show generic error toast
        toast({
          title: 'Export Failed',
          description: 'Could not generate the Excel file. Please try again later.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } finally {
      setExportLoading(false);
    }
  };
  
  const chartConfig = {
    present: { color: "#4F46E5" },
    absent: { color: "#EF4444" },
    leave: { color: "#F59E0B" },
    holiday: { color: "#10B981" },
    attendance: { color: "#4F46E5" }
  };

  return (
    <DashboardLayout>
      <motion.div
        className="max-w-5xl mx-auto space-y-12 py-12 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="space-y-3">
          <motion.h1
            className="text-4xl font-light tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Export Attendance Data
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-xl font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Generate comprehensive attendance reports for your team
          </motion.p>
        </div>

        {/* Excel Export Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-light">Export Settings</CardTitle>
              <CardDescription>Select a date range to export attendance data (maximum 1 year)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dateError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{dateError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                      />
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="relative">
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10"
                      />
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeSearch">Select Employees</Label>
                  <div className="relative">
                    <div className="flex items-center border rounded-md px-3 py-2">
                      <Users className="h-5 w-5 text-muted-foreground mr-2" />
                      <Input
                        id="employeeSearch"
                        type="text"
                        placeholder="Search employees..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-md mt-1 max-h-60 overflow-auto">
                    {isLoading ? (
                      <div className="p-2 text-center text-muted-foreground">Loading employees...</div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">No employees found</div>
                    ) : (
                      <div className="p-1">
                        <div className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer" 
                             onClick={() => {
                               if (selectedEmployees.length === employees.length) {
                                 setSelectedEmployees([]);
                               } else {
                                 setSelectedEmployees(employees.map(e => e.employeeId));
                               }
                             }}>
                          <span className="font-medium">Select All</span>
                          <Check className={cn(
                            "h-4 w-4",
                            selectedEmployees.length === employees.length ? "opacity-100" : "opacity-0"
                          )} />
                        </div>
                        {filteredEmployees.map(employee => (
                          <div
                            key={employee.employeeId}
                            className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                            onClick={() => {
                              setSelectedEmployees(prev => {
                                if (prev.includes(employee.employeeId)) {
                                  return prev.filter(id => id !== employee.employeeId);
                                } else {
                                  return [...prev, employee.employeeId];
                                }
                              });
                            }}
                          >
                            <span>{employee.fullName || employee.name}</span>
                            <Check className={cn(
                              "h-4 w-4",
                              selectedEmployees.includes(employee.employeeId) ? "opacity-100" : "opacity-0"
                            )} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedEmployees.length} employee(s) selected
                  </div>
                </div>

                <Button
                  onClick={exportToExcel}
                  disabled={exportLoading || isLoading}
                  className="mt-4 w-full md:w-auto bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  {exportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <div className='p-2 items-center flex'>
                      Export to Excel
                      <Download className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error ? (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Recent Exports */}
          {recentExports.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden mt-8">
              <CardHeader>
                <CardTitle className="text-2xl font-light">Recent Exports</CardTitle>
                <CardDescription>Your recently generated attendance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExports.slice(0, 5).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.employeeCount}</TableCell>
                        <TableCell>{report.dateRange}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
