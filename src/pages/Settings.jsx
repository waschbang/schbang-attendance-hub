
import DashboardLayout from '../components/layouts/DashboardLayout';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Configure your account and application preferences
        </p>
        
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
          Account settings and preferences will be displayed here. This page is under development.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
