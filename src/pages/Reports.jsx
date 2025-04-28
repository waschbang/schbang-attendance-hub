
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { motion } from 'framer-motion';

const Reports = () => {
  return (
    <DashboardLayout>
      <motion.div 
        className="max-w-5xl mx-auto space-y-16 py-8 px-4 sm:px-6"
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
          <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-16 flex items-center justify-center">
              <div className="text-center space-y-6">
                <p className="text-2xl font-light text-muted-foreground">
                  Your attendance reports will appear here
                </p>
                <p className="text-base font-light text-muted-foreground/70">
                  We're working on bringing you comprehensive reporting tools
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
