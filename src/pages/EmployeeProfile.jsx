
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

const EmployeeProfile = () => {
  const { employeeId } = useParams();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
        <p className="text-muted-foreground">
          Viewing profile for employee #{employeeId}
        </p>
        
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
          Detailed employee profile information will be displayed here. This page is under development.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeProfile;
