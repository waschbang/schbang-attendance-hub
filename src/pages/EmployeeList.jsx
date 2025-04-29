import { useState, useEffect } from 'react';
import { fetchEmployeesByDepartment } from '../services/employeeService';
import { Loader2, Search, Filter, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import EmployeeCard from '../components/ui/employee-card';
import DashboardLayout from '../components/layouts/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        // Fetch employees from the Rajasthan Project department
        const departmentId = '612996000034607912';
        const processedEmployees = await fetchEmployeesByDepartment(departmentId);
        
        setEmployees(processedEmployees);
        setFilteredEmployees(processedEmployees);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Moved the processEmployeeData function to the employeeService

  // Filter employees based on search query and department filter
  useEffect(() => {
    let filtered = [...employees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.fullName.toLowerCase().includes(query) || 
        emp.employeeId.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.designation.toLowerCase().includes(query)
      );
    }
    
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(emp => 
        emp.department === departmentFilter
      );
    }
    
    setFilteredEmployees(filtered);
  }, [searchQuery, departmentFilter, employees]);

  // Get unique departments for filter dropdown
  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);

  // Format date from API (DD-MM-YYYY) to a more readable format
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

  return (
    <DashboardLayout>
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <motion.div 
          className="mb-8 flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-primary/10 p-3 rounded-lg">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-light mb-2">Employee Directory</h1>
            <p className="text-muted-foreground">
              Manage and view all employees in the Rajasthan Project department
            </p>
          </div>
        </motion.div>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search employees..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-60">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading employee data...</span>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredEmployees.map(employee => (
              <motion.div key={employee.id} variants={itemVariants}>
                <EmployeeCard employee={employee} />
              </motion.div>
            ))}
          </motion.div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No employees found matching your filters</div>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('');
              }}>Clear Filters</Button>
            </div>
          )}
        </>
      )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeList;
