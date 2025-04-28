
import { useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useToast } from '../components/ui/use-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const { toast } = useToast();
  
  // Mock data for demonstration
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => 
    format(subDays(today, 6 - i), 'MMM dd')
  );
  
  // Demo attendance data
  const attendanceData = {
    present: [35, 38, 36, 33, 39, 30, 0],
    late: [5, 3, 7, 4, 2, 6, 0],
    absent: [2, 1, 3, 5, 1, 1, 0],
    leave: [1, 1, 0, 2, 3, 0, 0],
  };
  
  // Demo employee data
  const employeeList = [
    { id: 1, name: 'Jane Cooper', position: 'UI/UX Designer', status: 'present', checkin: '09:03 AM' },
    { id: 2, name: 'Wade Warren', position: 'Frontend Developer', status: 'late', checkin: '10:15 AM' },
    { id: 3, name: 'Esther Howard', position: 'Product Manager', status: 'present', checkin: '08:55 AM' },
    { id: 4, name: 'Cameron Williamson', position: 'Backend Developer', status: 'absent', checkin: '-' },
    { id: 5, name: 'Brooklyn Simmons', position: 'Data Analyst', status: 'present', checkin: '09:12 AM' },
  ];

  const generateChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  });

  // Line chart data
  const attendanceTrendData = {
    labels,
    datasets: [
      {
        label: 'Present',
        data: attendanceData.present,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Late',
        data: attendanceData.late,
        borderColor: 'rgb(249, 168, 37)',
        backgroundColor: 'rgba(249, 168, 37, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Bar chart data
  const attendanceBreakdownData = {
    labels,
    datasets: [
      {
        label: 'Present',
        data: attendanceData.present,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
      {
        label: 'Late',
        data: attendanceData.late,
        backgroundColor: 'rgba(249, 168, 37, 0.8)',
      },
      {
        label: 'Absent',
        data: attendanceData.absent,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'Leave',
        data: attendanceData.leave,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  // Pie chart data
  const statusDistributionData = {
    labels: ['Present', 'Late', 'Absent', 'Leave'],
    datasets: [
      {
        data: [39, 2, 1, 3],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(249, 168, 37, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(79, 70, 229)',
          'rgb(249, 168, 37)',
          'rgb(239, 68, 68)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Summary stats
  const summaryStats = [
    { title: 'Total Employees', value: 45, change: '+2', changeType: 'positive', description: 'From last month' },
    { title: 'On Time Rate', value: '87%', change: '+3%', changeType: 'positive', description: 'From last week' },
    { title: 'Absence Rate', value: '4%', change: '-1%', changeType: 'positive', description: 'From last week' },
    { title: 'Avg. Working Hours', value: '7.8', change: '+0.3', changeType: 'positive', description: 'Hours per day' },
  ];

  // Handle refresh data (mock)
  const handleRefresh = () => {
    toast({
      title: "Data refreshed",
      description: `Data updated as of ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of employee attendance for SchbangPeople
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              Refresh Data
            </Button>
            <Button>Generate Report</Button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center justify-end">
          <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, index) => (
            <Card key={index} className="data-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trends Chart */}
          <Card className="data-card">
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Daily attendance pattern over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line 
                  data={attendanceTrendData} 
                  options={generateChartOptions('Daily Attendance')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendance Breakdown Chart */}
          <Card className="data-card">
            <CardHeader>
              <CardTitle>Attendance Breakdown</CardTitle>
              <CardDescription>Detailed view by attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar 
                  data={attendanceBreakdownData} 
                  options={generateChartOptions('Daily Breakdown')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Today's Status Distribution */}
          <Card className="data-card">
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Current day status distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-72 w-72">
                <Pie 
                  data={statusDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employee List Card */}
          <Card className="data-card">
            <CardHeader>
              <CardTitle>Today's Employee Status</CardTitle>
              <CardDescription>Recent check-ins and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Employee</th>
                      <th className="text-left py-3 px-2">Position</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeList.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{employee.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{employee.position}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            employee.status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            employee.status === 'absent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{employee.checkin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm">View All Employees</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
