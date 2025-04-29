import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
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
import { 
  fetchEmployeeAttendance,
  fetchTodayAttendance,
  fetchLastNDaysAttendance,
  formatTimeForDisplay
} from '../services/attendanceService';
import { fetchMonthAttendance } from '../services/fetchMonthAttendance';

const AttendanceOverview = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  
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


  
  // Fetch employees and their attendance data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Step 1: Fetch all employees from the department
        console.log('Fetching all employees from department');
        const departmentId = '612996000034607912';
        const employeeList = await fetchEmployeesByDepartment(departmentId);
        
        console.log(`Found ${employeeList.length} employees in the department`);
        setEmployees(employeeList);
        setFilteredEmployees(employeeList);
        
        // Step 2: Get all employee IDs
        const allEmployeeIds = employeeList.map(emp => emp.employeeId);
        console.log(`Extracted ${allEmployeeIds.length} employee IDs for attendance fetch:`, allEmployeeIds);
        
        // Step 3: Fetch attendance data based on active tab
        const today = new Date();
        let attendanceResults = {};
        
        console.log(`Fetching attendance data for tab: ${activeTab}`);
        
        if (activeTab === 'today') {
          // For today's view, use the fetchTodayAttendance function
          attendanceResults = await fetchTodayAttendance(allEmployeeIds);
        } else if (activeTab === 'last3days') {
          // For 3-day view, use the fetchLastNDaysAttendance function
          attendanceResults = await fetchLastNDaysAttendance(allEmployeeIds, 3);
        } else if (activeTab === 'last7days') {
          // For 7-day view, use the fetchLastNDaysAttendance function
          attendanceResults = await fetchLastNDaysAttendance(allEmployeeIds, 7);
        } else if (activeTab === 'month') {
          // For monthly view, use the fetchMonthAttendance function
          console.log('Fetching monthly attendance data...');
          attendanceResults = await fetchMonthAttendance(allEmployeeIds);
        }
        
        console.log(`Successfully fetched attendance data for ${Object.keys(attendanceResults).length} employees`);
        
        // Normalize attendance data to ensure consistent format
        // This fixes the issue where some data might be objects and others arrays
        const normalizedResults = {};
        
        Object.keys(attendanceResults).forEach(empId => {
          const empData = attendanceResults[empId];
          console.log(`Normalizing data for employee ${empId}:`, empData);
          
          // Check if data exists and is not empty
          if (empData) {
            // If it's not an array, wrap it in an array
            if (!Array.isArray(empData)) {
              console.log(`Converting object to array for employee ${empId}`);
              normalizedResults[empId] = [empData];
            } else {
              normalizedResults[empId] = empData;
            }
          } else {
            // If no data, initialize with empty array
            normalizedResults[empId] = [];
          }
        });
        
        console.log('Normalized attendance data:', normalizedResults);
        setAttendanceData(normalizedResults);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

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
    // Get the attendance data for this employee
    const empData = attendanceData[employeeId];
    
    // Check if we have attendance data for this employee
    if (!empData) {
      console.log(`No attendance data found for employee ${employeeId}`);
      return {
        status: 'Yet to Check In',
        checkInTime: null,
        checkOutTime: null,
        workingHours: '0.00'
      };
    }
    
    console.log(`Attendance data for employee ${employeeId}:`, empData);
    
    // The data should now be in the format expected by the UI
    // The processZohoAttendanceData function in attendanceService.js
    // has already converted it to the right format
    
    // For today's tab, just return the data as is
    if (activeTab === 'today') {
      // If it's already in the right format, just return it
      if (empData.status) {
        console.log(`Using attendance record for employee ${employeeId}:`, empData);
        return empData;
      }
      
      // If it's an array (old format), get the most recent entry
      if (Array.isArray(empData) && empData.length > 0) {
        const record = empData[empData.length - 1];
        console.log(`Using most recent record for employee ${employeeId}:`, record);
        return record;
      }
    }
    
    // For multi-day tabs, return the data as is if it's an array
    if (Array.isArray(empData)) {
      return empData;
    }
    
    // If we reach here, just return the data as is
    return empData;
  };

  // Calculate attendance summary for multi-day views
  const calculateAttendanceSummary = (employeeId) => {
    const attendanceArray = attendanceData[employeeId] || [];
    
    if (!attendanceArray.length) {
      return { 
        present: 0, 
        absent: 0, 
        holidays: 0, 
        total: 0,
        totalHours: '0.00'
      };
    }
    
    const summary = attendanceArray.reduce((acc, day) => {
      // Count present days
      if (day.status === 'Present') {
        acc.present++;
        acc.totalHours += parseFloat(day.workingHours || 0);
      }
      // Count weekends and holidays
      else if (day.isWeekend || day.isHoliday) {
        acc.holidays++;
      }
      // Count absences and leaves
      else if (day.status === 'Absent' || day.isLeave) {
        acc.absent++;
      }
      
      acc.total++;
      return acc;
    }, { present: 0, absent: 0, holidays: 0, total: 0, totalHours: 0 });
    
    // Format total hours
    summary.totalHours = summary.totalHours.toFixed(2);
    
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
                            <TableHead className="text-right">Working Hours</TableHead>
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
                                <TableRow key={employee.id}>
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
                                  <TableCell className="text-right">
                                    {attendance.workingHours} hrs
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
                            <TableHead className="text-right">Working Hours</TableHead>
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
                                <TableRow key={employee.id}>
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
                                  <TableCell className="text-right">
                                    {summary.totalHours} hrs
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
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-medium">Last 7 Days Attendance</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(subDays(new Date(), 6), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
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
                            <TableHead className="text-right">Working Hours</TableHead>
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
                                <TableRow key={employee.id}>
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
                                  <TableCell className="text-right">
                                    {summary.totalHours} hrs
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
      </div>
    </DashboardLayout>
  );
};

export default AttendanceOverview;
