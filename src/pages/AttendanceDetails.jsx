
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar, ArrowLeft, Clock, UserCheck, UserX, Clock3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import DashboardLayout from '../components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

import { fetchEmployeeById } from '../services/employeeService';
import { fetchEmployeeAttendance, formatTimeForDisplay } from '../services/attendanceService';

const AttendanceDetails = () => {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('last7days');
  
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch employee details
        const employeeData = await fetchEmployeeById(employeeId);
        setEmployee(employeeData);
        
        // Fetch attendance data based on active tab
        const today = new Date();
        let startDate;
        
        if (activeTab === 'last7days') {
          startDate = subDays(today, 6);
        } else if (activeTab === 'last30days') {
          startDate = subDays(today, 29);
        }
        
        const attendanceResult = await fetchEmployeeAttendance(employeeId, startDate, today);
        setAttendanceData(attendanceResult);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load attendance data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [employeeId, activeTab]);

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

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!attendanceData || attendanceData.length === 0) {
      return { present: 0, absent: 0, holidays: 0, late: 0, totalHours: 0 };
    }
    
    return attendanceData.reduce((stats, day) => {
      // Count present days
      if (day.status === 'Present') {
        stats.present++;
        
        // Check if late (after 10:30 AM)
        if (day.checkInTime) {
          // Handle 12-hour format (e.g., "10:20 AM")
          if (day.checkInTime.includes('AM') || day.checkInTime.includes('PM')) {
            const [time, period] = day.checkInTime.split(' ');
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            
            // Check if late (after 10:30 AM)
            if ((period === 'AM' && hour === 10 && parseInt(minutes) >= 30) || 
                (period === 'AM' && hour === 11) || 
                (period === 'PM')) {
              stats.late++;
            }
          } 
          // Handle 24-hour format
          else {
            const [hours, minutes] = day.checkInTime.split(':');
            if (parseInt(hours) > 10 || (parseInt(hours) === 10 && parseInt(minutes) >= 30)) {
              stats.late++;
            }
          }
        }
        
        // Add working hours
        stats.totalHours += parseFloat(day.workingHours || 0);
      } 
      // Count absent days (excluding holidays and weekends)
      else if (day.status === 'Absent' && !day.isHoliday && !day.isWeekend) {
        stats.absent++;
      }
      // Count holidays and weekends
      else if (day.isHoliday || day.isWeekend) {
        stats.holidays++;
      }
      // Count leaves as absences
      else if (day.isLeave) {
        stats.absent++;
      }
      
      return stats;
    }, { present: 0, absent: 0, holidays: 0, late: 0, totalHours: 0 });
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/attendance/overview">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-light mb-2">Employee Attendance Details</h1>
              <p className="text-muted-foreground">
                Viewing detailed attendance records
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading attendance data...</span>
            </div>
          ) : error ? (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6 text-center text-red-600">
                {error}
              </CardContent>
            </Card>
          ) : (
            <>
              {employee && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <Avatar className="h-20 w-20 border-2 border-primary/10">
                        <AvatarImage src={employee.photo} alt={employee.fullName} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {getInitials(employee.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold">{employee.fullName}</h2>
                        <div className="text-muted-foreground">{employee.designation}</div>
                        <div className="text-sm">{employee.employeeId}</div>
                      </div>
                      
                      <div className="md:ml-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">Department</div>
                          <div className="font-medium">{employee.department}</div>
                        </div>
                        
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">Location</div>
                          <div className="font-medium">{employee.location || 'N/A'}</div>
                        </div>
                        
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">Joined</div>
                          <div className="font-medium">{employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM d, yyyy') : 'N/A'}</div>
                        </div>
                        
                        <div className="bg-primary/5 p-3 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-medium">{employee.status}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {calculateStats() && (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Present</p>
                            <h3 className="text-2xl font-bold">{calculateStats().present} days</h3>
                          </div>
                          <div className="p-2 bg-green-100 rounded-full">
                            <UserCheck className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Absent</p>
                            <h3 className="text-2xl font-bold">{calculateStats().absent} days</h3>
                          </div>
                          <div className="p-2 bg-red-100 rounded-full">
                            <UserX className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Late Check-ins</p>
                            <h3 className="text-2xl font-bold">{calculateStats().late} days</h3>
                          </div>
                          <div className="p-2 bg-amber-100 rounded-full">
                            <Clock className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Working Hours</p>
                            <h3 className="text-2xl font-bold">{calculateStats().totalHours.toFixed(2)} hrs</h3>
                          </div>
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Clock3 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
              
              <Tabs defaultValue="last7days" value={activeTab} onValueChange={handleTabChange} className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="last7days">Last 7 Days</TabsTrigger>
                    <TabsTrigger value="last30days">Last 30 Days</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="last7days" className="mt-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Attendance Log</CardTitle>
                      <CardDescription>
                        {format(subDays(new Date(), 6), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead className="text-right">Working Hours</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceData.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No attendance records found for this period
                                </TableCell>
                              </TableRow>
                            ) : (
                              attendanceData.map((day, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div className="font-medium">{day.date}</div>
                                    {(day.isHoliday || day.isWeekend) && (
                                      <div className="text-xs text-muted-foreground">
                                        {day.holidayName || (day.isWeekend ? 'Weekend' : '')}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(day.status)}>
                                      {day.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {day.checkInTime ? formatTime(day.checkInTime) : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {day.checkOutTime ? formatTime(day.checkOutTime) : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {day.workingHours} hrs
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="last30days" className="mt-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-medium">Attendance Log</CardTitle>
                      <CardDescription>
                        {format(subDays(new Date(), 29), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead className="text-right">Working Hours</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceData.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No attendance records found for this period
                                </TableCell>
                              </TableRow>
                            ) : (
                              attendanceData.map((day, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div className="font-medium">{day.date}</div>
                                    {(day.isHoliday || day.isWeekend) && (
                                      <div className="text-xs text-muted-foreground">
                                        {day.holidayName || (day.isWeekend ? 'Weekend' : '')}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(day.status)}>
                                      {day.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {day.checkInTime ? formatTime(day.checkInTime) : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {day.checkOutTime ? formatTime(day.checkOutTime) : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {day.workingHours} hrs
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceDetails;
