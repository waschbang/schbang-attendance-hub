import { useState, useEffect } from 'react';
import { fetchEmployeesByDepartment } from '../services/employeeService';
import { Loader2, Search, Filter, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container px-4 py-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-light text-slate-100 tracking-tight mb-1">Employee Directory</h1>
                <p className="text-slate-400">
                  Manage and view all employees in the Rajasthan Project department
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Search and Filter Section */}
          <motion.div 
            className="mb-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, ID, email, or designation..."
                      className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-60">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-100">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-slate-100">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept} className="text-slate-100">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Results Count and Clear Filters */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
              {(searchQuery || departmentFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-slate-300"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </motion.div>
          
          {/* Employee Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-slate-400">Loading employee data...</span>
            </div>
          ) : error ? (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-6 text-center text-red-400">
                {error}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              {filteredEmployees.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-slate-400 mb-4">No employees found matching your filters</div>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredEmployees.map(employee => (
                    <motion.div 
                      key={employee.id} 
                      variants={itemVariants}
                      layout
                    >
                      <EmployeeCard employee={employee} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeList;
