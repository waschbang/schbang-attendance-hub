
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

const AttendanceDetails = () => {
  const { employeeId } = useParams();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Employee Attendance Details</h1>
        <p className="text-muted-foreground">
          Viewing detailed attendance for employee #{employeeId}
        </p>
        
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
          Detailed attendance information will be displayed here. This page is under development.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceDetails;
