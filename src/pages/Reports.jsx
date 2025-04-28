
import { useState } from 'react';
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
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '../components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

const Reports = () => {
  const [reportType, setReportType] = useState('attendance');
  const today = new Date();

  // Dummy attendance report data
  const attendanceData = [
    { name: 'Monday', present: 42, absent: 3, late: 5 },
    { name: 'Tuesday', present: 45, absent: 2, late: 3 },
    { name: 'Wednesday', present: 43, absent: 4, late: 3 },
    { name: 'Thursday', present: 40, absent: 5, late: 5 },
    { name: 'Friday', present: 41, absent: 6, late: 3 },
  ];

  // Dummy department report data
  const departmentData = [
    { name: 'Design', attendance: 96, productivity: 89 },
    { name: 'Engineering', attendance: 92, productivity: 94 },
    { name: 'Marketing', attendance: 97, productivity: 88 },
    { name: 'Sales', attendance: 91, productivity: 93 },
    { name: 'HR', attendance: 99, productivity: 90 },
  ];

  // Dummy recent reports list
  const recentReports = [
    { id: 1, name: 'Monthly Attendance Summary', date: format(subDays(today, 2), 'MMM dd, yyyy'), type: 'Attendance' },
    { id: 2, name: 'Department Performance', date: format(subDays(today, 5), 'MMM dd, yyyy'), type: 'Performance' },
    { id: 3, name: 'Team Productivity Analysis', date: format(subDays(today, 7), 'MMM dd, yyyy'), type: 'Productivity' },
    { id: 4, name: 'Leave Patterns Report', date: format(subDays(today, 12), 'MMM dd, yyyy'), type: 'Leave' },
    { id: 5, name: 'Overtime Report', date: format(subDays(today, 14), 'MMM dd, yyyy'), type: 'Time' },
  ];

  const chartConfig = {
    present: { color: "#4F46E5" },
    absent: { color: "#EF4444" },
    late: { color: "#F59E0B" },
    attendance: { color: "#4F46E5" },
    productivity: { color: "#10B981" }
  };

  return (
    <DashboardLayout>
      <motion.div 
        className="max-w-5xl mx-auto space-y-16 py-12 px-6"
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
            Reports
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-xl font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            View and generate attendance insights
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="flex justify-center space-x-4 mb-12">
            <Button 
              variant={reportType === 'attendance' ? 'default' : 'outline'} 
              onClick={() => setReportType('attendance')}
              className="px-6 py-5 text-base font-light transition-all duration-300"
            >
              Attendance Report
            </Button>
            <Button 
              variant={reportType === 'department' ? 'default' : 'outline'} 
              onClick={() => setReportType('department')}
              className="px-6 py-5 text-base font-light transition-all duration-300"
            >
              Department Report
            </Button>
          </div>

          <motion.div
            key={reportType}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-light">
                  {reportType === 'attendance' ? 'Weekly Attendance Overview' : 'Department Performance'}
                </CardTitle>
                <CardDescription>
                  {reportType === 'attendance' 
                    ? 'Summary of employee attendance for the current week' 
                    : 'Attendance and productivity metrics across departments'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 w-full">
                  <ChartContainer 
                    config={chartConfig}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportType === 'attendance' ? attendanceData : departmentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fontWeight: 300 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fontWeight: 300 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />} 
                        />
                        {reportType === 'attendance' ? (
                          <>
                            <Bar dataKey="present" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <>
                            <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="productivity" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-light">Recent Reports</CardTitle>
              <CardDescription>Previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-light">{report.name}</TableCell>
                      <TableCell className="font-light">{report.type}</TableCell>
                      <TableCell className="font-light">{report.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Download</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
