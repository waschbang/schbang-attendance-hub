import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  UserX, 
  Clock3, 
  Filter, 
  Loader2, 
  Calendar as CalendarIcon,
  Search,
  Users,
  Eye,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

import DashboardLayout from '../components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

import { fetchEmployeesByDepartment } from '../services/employeeService';
import { formatTimeForDisplay } from '../services/attendanceService';
import { fetchMonthAttendance, filterAttendanceByPeriod } from '../services/fetchMonthAttendance';

const AttendanceOverview = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to store the full month's attendance data
  const [fullMonthData, setFullMonthData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  const [openAccordion, setOpenAccordion] = useState(null);

  // Function to handle accordion state
  const handleAccordionChange = (value) => {
    setOpenAccordion(value ? value : null);
  };

  // Fetch employees and their full month attendance data once on component mount and every 10 minutes
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Step 1: Fetch all employees from the department
        const departmentId = '612996000034607912';
        const employeeList = await fetchEmployeesByDepartment(departmentId);
        
        setEmployees(employeeList);
        setFilteredEmployees(employeeList);
        
        // Step 2: Get all employee IDs
        const allEmployeeIds = employeeList.map(emp => emp.employeeId);
        
        // Step 3: Fetch full month attendance data for all employees
        const monthData = await fetchMonthAttendance(allEmployeeIds);
        console.log('Fetched full month attendance data:', monthData);
        setFullMonthData(monthData);
        setLastRefreshed(new Date());
        
        // Filter attendance data based on active tab
        const filterAttendanceDataByTab = (data) => {
          if (!data) {
            console.log('No data to filter');
            return;
          }
          
          console.log('Filtering attendance data by tab:', activeTab);
          console.log('Full month data:', data);
          
          let today = new Date();
          let startDate;
          
          if (activeTab === 'today') {
            startDate = today;
          } else if (activeTab === 'last3days') {
            startDate = subDays(today, 2);
          } else if (activeTab === 'last7days') {
            startDate = subDays(today, 6);
          } else if (activeTab === 'month') {
            // For month tab, simply use the last 30 days
            startDate = subDays(today, 29); // 29 days back + today = 30 days
          }
          
          // Check if startDate is defined (for safety)
          if (!startDate) {
            console.warn('Start date is undefined, defaulting to today');
            startDate = today;
          }
          
          // Set the year to the current year to match with API data
          const currentYear = new Date().getFullYear();
          startDate = new Date(currentYear, startDate.getMonth(), startDate.getDate());
          today = new Date(currentYear, today.getMonth(), today.getDate());
          
          console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(today, 'yyyy-MM-dd'));
          console.log('Using current year:', currentYear);
          
          const filteredData = filterAttendanceByPeriod(data, startDate, today);
          console.log('Filtered attendance data:', filteredData);
          
          setAttendanceData(filteredData);
        };
        
        filterAttendanceDataByTab(monthData);
      } catch (error) {
        console.error('Error fetching initial data:');
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial data fetch
    fetchInitialData();
    
    // Set up automatic refresh every 10 minutes (600000 ms)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing attendance data (10-minute interval)');
      refreshAttendanceData();
    }, 600000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []); // Empty dependency array means this runs once on mount
  
  // Filter the attendance data when the active tab changes
  useEffect(() => {
    if (fullMonthData) {
      let today = new Date();
      let startDate;
      
      if (activeTab === 'today') {
        startDate = today;
      } else if (activeTab === 'last3days') {
        startDate = subDays(today, 2);
      } else if (activeTab === 'last7days') {
        startDate = subDays(today, 6);
      } else if (activeTab === 'month') {
        // For month tab, simply use the last 30 days
        startDate = subDays(today, 29); // 29 days back + today = 30 days
      }
      
      // Make sure startDate is defined
      if (!startDate) {
        console.warn('Start date is undefined, defaulting to today');
        startDate = today;
      }
      
      console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(today, 'yyyy-MM-dd'));
      
      const filteredData = filterAttendanceByPeriod(fullMonthData, startDate, today);
      console.log('Filtered attendance data:', filteredData);
      
      setAttendanceData(filteredData);
    }
  }, [activeTab, fullMonthData]);
  
  // Function to refresh the attendance data
  const refreshAttendanceData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      const allEmployeeIds = employees.map(emp => emp.employeeId);
      
      const monthData = await fetchMonthAttendance(allEmployeeIds);
      setFullMonthData(monthData);
      setLastRefreshed(new Date());
      
      // Filter the data based on the active tab
      let today = new Date();
      let startDate;
      
      if (activeTab === 'today') {
        startDate = today;
      } else if (activeTab === 'last3days') {
        startDate = subDays(today, 2);
      } else if (activeTab === 'last7days') {
        startDate = subDays(today, 6);
      } else if (activeTab === 'month') {
        // For month tab, simply use the last 30 days
        startDate = subDays(today, 29); // 29 days back + today = 30 days
      }
      
      // Check if startDate is defined (for safety)
      if (!startDate) {
        console.warn('Start date is undefined, defaulting to today');
        startDate = today;
      }
      
      // Set the year to the current year to match with API data
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, startDate.getMonth(), startDate.getDate());
      today = new Date(currentYear, today.getMonth(), today.getDate());
      
      console.log('Refresh: Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(today, 'yyyy-MM-dd'));
      
      const filteredData = filterAttendanceByPeriod(monthData, startDate, today);
      setAttendanceData(filteredData);
    } catch (error) {
      console.error('Error refreshing attendance data:');
      setError('Failed to refresh attendance data. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter employees based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEmployees(employees);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(emp => 
      emp.fullName.toLowerCase().includes(query) || 
      emp.employeeId.toLowerCase().includes(query)
    );
    
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  
  // Navigate to employee details page
  const handleEmployeeClick = (employeeId) => {
    // Find the employee data
    const employee = employees.find(emp => emp.employeeId === employeeId);
    
    // Get the attendance data for this employee
    const employeeAttendance = fullMonthData ? fullMonthData[employeeId] || [] : [];
    
    // Store the data in localStorage to avoid additional API calls
    localStorage.setItem('selectedEmployee', JSON.stringify(employee));
    localStorage.setItem('selectedEmployeeAttendance', JSON.stringify(employeeAttendance));
    
    // Navigate to the employee details page
    navigate(`/attendance/${employeeId}`);
  };

  // Format time to 12-hour format
  const formatTime = (timeString) => {
    return formatTimeForDisplay(timeString);
  };

  // Get status badge variant based on attendance status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Absent':
        return 'destructive';
      case 'Yet to Check In':
        return 'warning';
      case 'Holiday':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get employee attendance for today
  const getEmployeeAttendance = (employeeId) => {
    console.log(`Getting attendance for employee ${employeeId}`);
    console.log('Current attendance data:', attendanceData);
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const employeeAttendance = attendanceData[employeeId] || [];
    
    console.log(`Employee ${employeeId} attendance:`, employeeAttendance);
    
    // For today tab, find today's record
    if (activeTab === 'today') {
      // If it's an array (which it should be), get the first entry
      // Our updated fetchMonthAttendance ensures there's at least one record for today
      if (Array.isArray(employeeAttendance) && employeeAttendance.length > 0) {
        // Find today's record
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayRecord = employeeAttendance.find(record => record.date === todayStr);
        
        if (todayRecord) {
          console.log(`Using today's record for employee ${employeeId}:`, todayRecord);
          return todayRecord;
        }
        
        // If no specific today record found, use the first one
        console.log(`Using first record for employee ${employeeId}:`, employeeAttendance[0]);
        return employeeAttendance[0];
      }
      
      // If it's not an array but has status (old format), return it
      if (employeeAttendance.status) {
        console.log(`Using attendance record for employee ${employeeId}:`, employeeAttendance);
        return employeeAttendance;
      }
    }
    
    // For multi-day tabs, return the data as is if it's an array
    if (Array.isArray(employeeAttendance)) {
      return employeeAttendance;
    }
    
    // If we reach here, just return the data as is
    return employeeAttendance;
  };

  // Calculate attendance summary for multi-day views
  const calculateAttendanceSummary = (employeeId) => {
    const attendanceArray = attendanceData[employeeId] || [];
    
    console.log(`Calculating attendance summary for employee ${employeeId}`);
    console.log('Attendance array:', attendanceArray);
    
    if (!attendanceArray.length) {
      console.log('No attendance data found for this employee');
      return { 
        present: 0, 
        absent: 0, 
        holidays: 0, 
        total: 0
      };
    }
    
    const summary = attendanceArray.reduce((acc, day) => {
      console.log('Processing day:', day);
      console.log('Current status:', day.status, 'Check-in time:', day.checkInTime);
      
      // Count present days - if status is Present OR check-in time exists
      if (day.status === 'Present' || day.checkInTime) {
        console.log('Counting as PRESENT');
        acc.present++;
      }
      // Count weekends and holidays (only if not present)
      else if ((day.isWeekend || day.isHoliday) && !day.checkInTime) {
        console.log('Counting as HOLIDAY');
        acc.holidays++;
      }
      // Count absences and leaves (only if not present)
      else if ((day.status === 'Absent' || day.isLeave) && !day.checkInTime) {
        console.log('Counting as ABSENT');
        acc.absent++;
      }
      // Handle 'Yet to Check In' status for today
      else if (day.status === 'Yet to Check In') {
        // Don't count as absent if it's today and they haven't checked in yet
        const today = format(new Date(), 'yyyy-MM-dd');
        if (day.date === today) {
          console.log('Today - not counting');
          // Don't count it in any category
        } else {
          console.log('Counting as ABSENT (Yet to Check In)');
          acc.absent++;
        }
      }
      
      console.log('Current totals:', acc);
      
      acc.total++;
      return acc;
    }, { present: 0, absent: 0, holidays: 0, total: 0 });
    
    return summary;
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // Function to render the table header based on active tab
  const renderTableHeader = () => {
    if (activeTab === 'today') {
      return (
        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
          <TableHead className="text-slate-400 font-medium">Employee</TableHead>
          <TableHead className="text-slate-400 font-medium">Department</TableHead>
          <TableHead className="text-slate-400 font-medium">Status</TableHead>
          <TableHead className="text-slate-400 font-medium">Check In</TableHead>
          <TableHead className="text-slate-400 font-medium">Check Out</TableHead>
          <TableHead className="text-slate-400 font-medium">Summary</TableHead>
        </TableRow>
      );
    }
    return (
      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
        <TableHead className="text-slate-400 font-medium">Employee</TableHead>
        <TableHead className="text-slate-400 font-medium">Department</TableHead>
        <TableHead className="text-slate-400 font-medium">Employee Activity</TableHead>
        <TableHead className="text-slate-400 font-medium">Summary</TableHead>
      </TableRow>
    );
  };

  // Function to render activity details for multiple days
  const renderActivityDetails = (employeeId) => {
    const attendance = getEmployeeAttendance(employeeId);
    if (!Array.isArray(attendance)) return null;

    return (
      <div className="relative">
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={openAccordion}
          onValueChange={handleAccordionChange}
        >
          <AccordionItem value={employeeId} className="border-none">
            <AccordionTrigger className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors [&[data-state=open]>svg]:rotate-180">
              <span className="text-sm font-medium text-slate-100">View Activity</span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="absolute z-50 left-0 mt-2 w-[400px] bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl">
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                  {attendance.map((day, index) => (
                    <div 
                      key={day.date} 
                      className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-800/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{day.date}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-slate-300">
                                In: {day.checkInTime ? formatTime(day.checkInTime) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-400" />
                              <span className="text-sm text-slate-300">
                                Out: {day.checkOutTime ? formatTime(day.checkOutTime) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={getStatusBadgeVariant(day.status)}
                          className="font-medium"
                        >
                          {day.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Backdrop blur when accordion is open */}
        {openAccordion === employeeId && (
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
            onClick={() => setOpenAccordion(null)}
          />
        )}
      </div>
    );
  };

  // Function to render table row based on active tab
  const renderTableRow = (employee, index) => {
    const attendance = getEmployeeAttendance(employee.employeeId);
    const summary = calculateAttendanceSummary(employee.employeeId);

    return (
      <motion.tr
        key={employee.employeeId}
        className={`
          ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/20'}
          transition-all duration-200 hover:bg-slate-700/50
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-slate-700">
              <AvatarImage src={employee.photo} alt={employee.fullName} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {getInitials(employee.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-100">{employee.fullName}</div>
              <div className="text-sm text-slate-400">{employee.designation}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-slate-300">{employee.department}</TableCell>
        
        {activeTab === 'today' ? (
          <>
            <TableCell>
              <Badge 
                variant={getStatusBadgeVariant(attendance?.status)}
                className="font-medium"
              >
                {attendance?.status || 'Not Available'}
              </Badge>
            </TableCell>
            <TableCell className="text-slate-300">
              {attendance?.checkInTime ? formatTime(attendance.checkInTime) : 'N/A'}
            </TableCell>
            <TableCell className="text-slate-300">
              {attendance?.checkOutTime ? formatTime(attendance.checkOutTime) : 'N/A'}
            </TableCell>
          </>
        ) : (
          <TableCell>
            {renderActivityDetails(employee.employeeId)}
          </TableCell>
        )}
        
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">{summary.present}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserX className="h-4 w-4 text-red-400" />
              <span className="text-sm text-slate-300">{summary.absent}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-300">{summary.late}</span>
            </div>
          </div>
        </TableCell>
      </motion.tr>
    );
  };

  // If the component is in full-screen loading state, show the loading animation
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container px-4 py-8 max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col items-center justify-center min-h-[70vh] gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="relative w-24 h-24"
            >
              <motion.div 
                className="absolute inset-0"
              animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                  rotate: {
                repeat: Infinity, 
                duration: 2,
                ease: "linear"
                  },
                  scale: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                  },
                  opacity: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="w-full h-full rounded-xl bg-gradient-to-r from-primary via-secondary to-primary opacity-50 blur-xl" />
              </motion.div>
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ 
                  rotate: -360
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 4,
                  ease: "linear"
                }}
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary to-secondary" />
              </motion.div>
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0.8 }}
                animate={{ 
                  rotate: 360,
                  scale: [0.8, 1, 0.8]
                }}
                transition={{ 
                  rotate: {
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear"
                  },
                  scale: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-background shadow-xl" />
              </motion.div>
            </motion.div>
            
            <div className="text-center space-y-3">
            <motion.h2 
                className="text-2xl font-medium text-foreground"
              animate={{ 
                  opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                repeat: Infinity, 
                  duration: 2,
                ease: "easeInOut" 
              }}
            >
                Loading Data
            </motion.h2>
            
            <motion.p 
                className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
                Fetching attendance records...
            </motion.p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Regular render with data
  return (
    <DashboardLayout>
      <div className={`min-h-screen bg-slate-900 font-inter ${openAccordion ? 'relative' : ''}`}>
        <div className="container px-4 py-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
        <motion.div 
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-blue-500/10 p-3 rounded-xl backdrop-blur-sm border border-blue-500/20">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Attendance Overview</h1>
              <p className="text-sm text-slate-400">
                {lastRefreshed && `Last updated: ${format(lastRefreshed, 'MMM d, yyyy h:mm a')}`}
              </p>
            </div>
          </motion.div>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 
                transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30
                hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Employees</p>
                  <h3 className="text-2xl font-bold text-slate-100">{employees.length}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Users className="h-6 w-6 text-blue-400" />
              </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 
                transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:border-green-500/30
                hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                                        <div>
                  <p className="text-sm font-medium text-slate-400">Present Today</p>
                  <h3 className="text-2xl font-bold text-slate-100">
                    {filteredEmployees.filter(emp => {
                      const attendance = getEmployeeAttendance(emp.employeeId);
                      return attendance && attendance.status === 'Present';
                    }).length}
                  </h3>
                                        </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-400" />
                                      </div>
                      </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 
                transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/30
                hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                                        <div>
                  <p className="text-sm font-medium text-slate-400">Late Check-ins</p>
                  <h3 className="text-2xl font-bold text-slate-100">
                    {filteredEmployees.filter(emp => {
                      const attendance = getEmployeeAttendance(emp.employeeId);
                      return attendance && attendance.isLate;
                    }).length}
                  </h3>
                                        </div>
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-400" />
                                      </div>
                      </div>
            </motion.div>
          </motion.div>

          {/* Employee Table */}
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                        <div>
                  <h3 className="text-lg font-semibold text-slate-100">Employee Attendance</h3>
                  <p className="text-sm text-slate-400">View and manage employee attendance records</p>
                                        </div>
                
                {/* Modern Segmented Control */}
                <div className="flex items-center gap-4">
                  <div className="relative flex flex-nowrap items-center bg-background/50 backdrop-blur-md rounded-full p-1 border border-border overflow-x-auto max-w-full no-scrollbar">
                    {['today', 'last3days', 'last7days', 'month'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`
                          relative min-w-[80px] px-4 py-2 text-sm font-medium rounded-full
                          transition-all duration-200 ease-in-out whitespace-nowrap
                          touch-manipulation select-none
                          ${activeTab === tab 
                            ? 'text-primary-foreground bg-primary shadow-lg shadow-primary/20 transform scale-100' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 transform scale-95'
                          }
                          focus:outline-none
                          active:scale-90
                          disabled:pointer-events-none
                          -webkit-tap-highlight-color: transparent;
                        `}
                        aria-pressed={activeTab === tab}
                        disabled={activeTab === tab}
                      >
                        {tab === 'today' && 'Today'}
                        {tab === 'last3days' && '3 Days'}
                        {tab === 'last7days' && '7 Days'}
                        {tab === 'month' && 'Month'}
                      </button>
                    ))}
                                      </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500"
                      />
                      </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800/50 border-slate-700/50 text-slate-100 hover:bg-slate-700/50"
                      onClick={refreshAttendanceData}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                  {renderTableHeader()}
                          </TableHeader>
                          <TableBody>
                  <AnimatePresence>
                    {filteredEmployees.map((employee, index) => renderTableRow(employee, index))}
                  </AnimatePresence>
                          </TableBody>
                        </Table>
                      </div>
        </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview;
