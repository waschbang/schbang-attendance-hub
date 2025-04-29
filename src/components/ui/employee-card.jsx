import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { Mail, Phone } from 'lucide-react';

const EmployeeCard = ({ employee }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const [day, month, year] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-md border">
              <AvatarImage src={employee.photo} alt={employee.fullName} />
              <AvatarFallback className="rounded-md text-lg bg-primary/10 text-primary">
                {getInitials(employee.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-lg">{employee.fullName}</h3>
              <p className="text-muted-foreground">{employee.designation}</p>
              <Badge variant="outline" className="mt-1 font-normal">
                {employee.employeeId}
              </Badge>
            </div>
          </div>
          
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.mobile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{employee.mobile}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="text-muted-foreground">Department</div>
              <div className="text-right font-medium">{employee.department}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Location</div>
              <div className="text-right font-medium">{employee.location}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Joined</div>
              <div className="text-right font-medium">{formatDate(employee.dateOfJoining)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Status</div>
              <div className="text-right">
                <Badge 
                  variant={employee.status === 'Active' ? 'default' : 'secondary'}
                  className={employee.status === 'Active' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20' : ''}
                >
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
