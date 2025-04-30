import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Search
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
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
    }
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

  // If the component is in full-screen loading state, show the Schbanging animation
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container px-4 py-8 max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col items-center justify-center min-h-[70vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative w-24 h-24 mb-6"
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "linear" 
              }}
            >
              <Loader2 className="h-24 w-24 text-primary" />
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-bold text-primary mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut" 
              }}
            >
              Schbanging!!
            </motion.h2>
            
            <motion.p 
              className="text-gray-500 text-md mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Fetching data for {employees.length} employees...
            </motion.p>
            
            <motion.p 
              className="text-gray-400 text-sm mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              This may take a moment due to API rate limits
            </motion.p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Regular render with data
  return (
    <DashboardLayout>
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <motion.div 
          className="flex flex-col space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Refresh status and button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {lastRefreshed ? (
                <span>Last updated: {format(lastRefreshed, 'dd MMM yyyy, hh:mm a')}</span>
              ) : (
                <span>Loading attendance data...</span>
              )}
            </div>
            <Button 
              onClick={refreshAttendanceData} 
              disabled={isRefreshing || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  Refresh Data
                </>
              )}
            </Button>
          </div>
          
          <motion.div 
            className="mb-8 flex items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-primary/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-light mb-2">Attendance Overview</h1>
              <p className="text-muted-foreground">
                Track employee attendance and working hours
              </p>
            </div>
          </motion.div>
          
          <Tabs defaultValue="today" value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="last3days">Last 3 Days</TabsTrigger>
                <TabsTrigger value="last7days">Last 7 Days</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {error ? (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6 text-center text-red-600">
                  {error}
                </CardContent>
              </Card>
            ) : (
              <>
                <TabsContent value="today" className="mt-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Today's Attendance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Employee</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No employees found matching your search
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredEmployees.map(employee => {
                                const attendance = getEmployeeAttendance(employee.employeeId);
                                return (
                                  <TableRow 
                                    key={employee.employeeId} 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                    onClick={() => handleEmployeeClick(employee.employeeId)}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={employee.photo} alt={employee.fullName} />
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(employee.fullName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{employee.fullName}</div>
                                          <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusBadgeVariant(attendance.status)}>
                                        {attendance.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {attendance.checkInTime ? formatTime(attendance.checkInTime) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {attendance.checkOutTime ? formatTime(attendance.checkOutTime) : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="last3days" className="mt-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Last 3 Days Attendance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(subDays(new Date(), 2), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Employee</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Holidays</TableHead>

                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No employees found matching your search
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredEmployees.map(employee => {
                                const summary = calculateAttendanceSummary(employee.employeeId);
                                
                                return (
                                  <TableRow 
                                    key={employee.employeeId} 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                    onClick={() => handleEmployeeClick(employee.employeeId)}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={employee.photo} alt={employee.fullName} />
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(employee.fullName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{employee.fullName}</div>
                                          <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="success" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                        {summary.present} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                                        {summary.absent} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {summary.holidays} days
                                      </Badge>
                                    </TableCell>

                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="last7days" className="mt-0">
                  {/* Similar to last3days tab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Last 7 Days Attendance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(subDays(new Date(), 6), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {/* Table content similar to last3days */}
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Employee</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Holidays</TableHead>

                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No employees found matching your search
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredEmployees.map(employee => {
                                const summary = calculateAttendanceSummary(employee.employeeId);
                                
                                return (
                                  <TableRow 
                                    key={employee.employeeId} 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                    onClick={() => handleEmployeeClick(employee.employeeId)}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={employee.photo} alt={employee.fullName} />
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(employee.fullName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{employee.fullName}</div>
                                          <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="success" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                        {summary.present} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                                        {summary.absent} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {summary.holidays} days
                                      </Badge>
                                    </TableCell>

                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="month" className="mt-0">
                  {/* Similar to last7days tab but for the full month */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Monthly Attendance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(subDays(new Date(), 30), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {/* Table content similar to last7days */}
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Employee</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Holidays</TableHead>

                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No employees found matching your search
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredEmployees.map(employee => {
                                const summary = calculateAttendanceSummary(employee.employeeId);
                                
                                return (
                                  <TableRow 
                                    key={employee.employeeId} 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                    onClick={() => handleEmployeeClick(employee.employeeId)}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={employee.photo} alt={employee.fullName} />
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(employee.fullName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{employee.fullName}</div>
                                          <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="success" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                        {summary.present} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                                        {summary.absent} days
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {summary.holidays} days
                                      </Badge>
                                    </TableCell>

                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview;
