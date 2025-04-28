
import { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DashboardLayout from '../components/layouts/DashboardLayout';

const Settings = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    updates: false,
    marketing: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: true,
    activityAlerts: false
  });

  const [accessControlSettings, setAccessControlSettings] = useState({
    viewAttendance: ['admin', 'manager'],
    editAttendance: ['admin'],
    viewReports: ['admin', 'manager', 'team-lead'],
    manageUsers: ['admin']
  });

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  const handleSecurityChange = (setting) => {
    setSecuritySettings({
      ...securitySettings,
      [setting]: !securitySettings[setting]
    });
  };

  const accessLevels = ['admin', 'manager', 'team-lead', 'employee'];

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
            Settings
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-xl font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Customize your experience
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="mb-8 justify-start">
              <TabsTrigger value="notifications" className="px-6 py-3 text-base font-light">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="px-6 py-3 text-base font-light">Security</TabsTrigger>
              <TabsTrigger value="access" className="px-6 py-3 text-base font-light">Access Control</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="mt-0">
              <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-light">Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="text-base font-light">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notificationSettings.email}
                      onCheckedChange={() => handleNotificationChange('email')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications" className="text-base font-light">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={notificationSettings.push}
                      onCheckedChange={() => handleNotificationChange('push')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="updates-notifications" className="text-base font-light">System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system updates
                      </p>
                    </div>
                    <Switch 
                      id="updates-notifications" 
                      checked={notificationSettings.updates}
                      onCheckedChange={() => handleNotificationChange('updates')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-notifications" className="text-base font-light">Marketing</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive marketing and promotional emails
                      </p>
                    </div>
                    <Switch 
                      id="marketing-notifications" 
                      checked={notificationSettings.marketing}
                      onCheckedChange={() => handleNotificationChange('marketing')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-0">
              <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-light">Security Settings</CardTitle>
                  <CardDescription>Manage your account security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor" className="text-base font-light">Two Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch 
                      id="two-factor" 
                      checked={securitySettings.twoFactor}
                      onCheckedChange={() => handleSecurityChange('twoFactor')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="session-timeout" className="text-base font-light">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </p>
                    </div>
                    <Switch 
                      id="session-timeout" 
                      checked={securitySettings.sessionTimeout}
                      onCheckedChange={() => handleSecurityChange('sessionTimeout')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="activity-alerts" className="text-base font-light">Activity Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about unusual account activity
                      </p>
                    </div>
                    <Switch 
                      id="activity-alerts" 
                      checked={securitySettings.activityAlerts}
                      onCheckedChange={() => handleSecurityChange('activityAlerts')}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="mr-4">Change Password</Button>
                    <Button variant="destructive">Reset Security Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="access" className="mt-0">
              <Card className="border-0 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-light">Access Control</CardTitle>
                  <CardDescription>Manage permissions for different user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.keys(accessControlSettings).map(permission => (
                      <div key={permission} className="space-y-2">
                        <Label className="text-base font-light capitalize">
                          {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {accessLevels.map(level => (
                            <Button
                              key={level}
                              variant={accessControlSettings[permission].includes(level) ? "default" : "outline"}
                              size="sm"
                              className="capitalize font-light"
                              onClick={() => {
                                const updatedLevels = accessControlSettings[permission].includes(level)
                                  ? accessControlSettings[permission].filter(l => l !== level)
                                  : [...accessControlSettings[permission], level];
                                  
                                setAccessControlSettings({
                                  ...accessControlSettings,
                                  [permission]: updatedLevels
                                });
                              }}
                            >
                              {level}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
