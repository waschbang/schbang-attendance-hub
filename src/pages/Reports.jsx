
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 py-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-lg font-light">
            View and generate attendance insights
          </p>
        </div>
        
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-xl font-light text-muted-foreground">
                Your attendance reports will appear here
              </p>
              <p className="text-sm text-muted-foreground/70">
                We're working on bringing you comprehensive reporting tools
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
