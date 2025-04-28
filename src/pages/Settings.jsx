
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 py-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-lg font-light">
            Customize your experience
          </p>
        </div>
        
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-xl font-light text-muted-foreground">
                Preferences and settings will appear here
              </p>
              <p className="text-sm text-muted-foreground/70">
                We're building tools to personalize your experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
