import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { Mail, Phone, MapPin, Calendar, Building2 } from 'lucide-react';

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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
        <CardContent className="p-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-slate-700/50 group-hover:border-slate-600/50 transition-colors">
              <AvatarImage src={employee.photo} alt={employee.fullName} className="object-cover" />
              <AvatarFallback className="rounded-xl text-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                {getInitials(employee.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg text-slate-100 truncate mb-1">{employee.fullName}</h3>
              <p className="text-slate-400 text-sm mb-2">{employee.designation}</p>
              <Badge 
                variant="outline" 
                className="bg-slate-800/50 border-slate-700/50 text-slate-300 font-normal"
              >
                {employee.employeeId}
              </Badge>
            </div>
          </div>
          
          {/* Contact Info Section */}
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Mail className="h-4 w-4" />
              <span className="truncate hover:text-slate-300 transition-colors">
                {employee.email}
              </span>
            </div>
            {employee.mobile && (
              <div className="flex items-center gap-2.5 text-slate-400">
                <Phone className="h-4 w-4" />
                <span className="hover:text-slate-300 transition-colors">
                  {employee.mobile}
                </span>
              </div>
            )}
          </div>
          
          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{employee.department}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{employee.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(employee.dateOfJoining)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Badge 
                variant={employee.status === 'Active' ? 'default' : 'secondary'}
                className={employee.status === 'Active' 
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20' 
                  : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}
              >
                {employee.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmployeeCard;
