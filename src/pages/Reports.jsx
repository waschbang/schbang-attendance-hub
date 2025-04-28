
import DashboardLayout from '../components/layouts/DashboardLayout';

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-muted-foreground">
          Generate and view detailed attendance reports
        </p>
        
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
          Attendance reporting features will be displayed here. This page is under development.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
