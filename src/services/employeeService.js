import axios from 'axios';
import { getAuthHeader } from './authService';

// Base API URL - Using Vite proxy to avoid CORS issues
const API_BASE_URL = '/zoho-api/people/api';

// Store employees data in memory to avoid redundant API calls
let employeesCache = {};

// Fetch all employees (from all departments)
export const fetchAllEmployees = async () => {
  console.log('Fetching all employees');
  
  try {
    // For now, just fetch from the main department
    // In a real implementation, you might need to fetch from multiple departments
    // or use a different API endpoint that returns all employees
    const mainDepartmentId = '612996000034607912'; // Replace with your actual department ID
    console.log(`Using main department ID: ${mainDepartmentId}`);
    
    const employees = await fetchEmployeesByDepartment(mainDepartmentId);
    console.log(`Successfully fetched ${employees.length} employees`);
    return employees;
  } catch (error) {
    console.error('Error fetching all employees:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Get token from local storage or another auth management system
// const getAuthToken = () => {
//   // Replace with your actual token management
//   return localStorage.getItem('auth_token');
// };

// Fetch employees by department
export const fetchEmployeesByDepartment = async (departmentId) => {
  console.log(`Fetching employees for department ${departmentId}`);
  
  try {
    const authHeader = await getAuthHeader();
    
    const response = await axios.get(
      `${API_BASE_URL}/forms/employee/getRelatedRecords?parentModule=department&id=${departmentId}&sIndex=1&limit=200`,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Employee API response:', response.data);
    
    // If we have a valid response, process and cache the data
    if (response.data) {
      const processedData = processEmployeeData(response.data);
      console.log(`Processed ${processedData.length} employees for department ${departmentId}`);
      
      employeesCache.byDepartment = employeesCache.byDepartment || {};
      employeesCache.byDepartment[departmentId] = processedData;
      return processedData;
    }
    
    console.warn(`No employee data received for department ${departmentId}`);
    return [];
  } catch (error) {
    console.error(`Error fetching employees for department ${departmentId}:`, error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Process the nested response data into a flattened format
export const processEmployeeData = (data) => {
  if (!data || !data.response || !data.response.result) return [];

  const processedData = [];
  
  data.response.result.forEach(item => {
    // Each item in result is an object with a single key (employee ID)
    const employeeId = Object.keys(item)[0];
    const employeeData = item[employeeId][0]; // The actual employee data is in an array
    
    // Skip employees with terminated, inactive, resigned, or abscond status
    const status = employeeData.Employeestatus || '';
    if (status.toLowerCase() === 'terminated' || 
        status.toLowerCase() === 'inactive' || 
        status.toLowerCase() === 'resigned' ||
        status.toLowerCase() === 'abscond') {
      return; // Skip this employee
    }
    
    if (employeeData) {
      processedData.push({
        id: employeeId,
        zohoId: employeeData.Zoho_ID || '',
        employeeId: employeeData.EmployeeID || '',
        firstName: employeeData.FirstName || '',
        lastName: employeeData.LastName || '',
        fullName: `${employeeData.FirstName || ''} ${employeeData.LastName || ''}`.trim(),
        email: employeeData.EmailID || '',
        mobile: employeeData.Mobile || '',
        designation: employeeData.Designation || '',
        department: employeeData.Department || '',
        reportingTo: employeeData.Reporting_To || '',
        location: employeeData.Work_location || '',
        joiningDate: employeeData.Dateofjoining || '',
        status: employeeData.Employeestatus || 'Active',
        photo: employeeData.Photo_downloadUrl || '',
        band: employeeData.Band || '',
        probationDate: employeeData.Probation_date || '',
        // Add more fields as needed
      });
    }
  });
  
  return processedData;
};

// Get employee details by ID
export const fetchEmployeeById = async (employeeId) => {
  console.log(`Fetching employee with ID ${employeeId}`);
  
  try {
    // Check if employee is in cache
    if (employeesCache.byId && employeesCache.byId[employeeId]) {
      console.log(`Found employee ${employeeId} in cache`);
      return employeesCache.byId[employeeId];
    }
    
    console.log(`Employee ${employeeId} not in cache, fetching from API`);
    
    // If not in cache, fetch from API
    const authHeader = await getAuthHeader();
    
    const response = await axios.get(
      `${API_BASE_URL}/forms/employee/getRecordByID?id=${employeeId}`,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Employee API response for ID ${employeeId}:`, response.data);
    
    // Process the employee data
    if (response.data && response.data.response && response.data.response.result) {
      const employeeData = response.data.response.result;
      
      const processedEmployee = {
        id: employeeId,
        zohoId: employeeData.Zoho_ID || '',
        employeeId: employeeData.EmployeeID || '',
        firstName: employeeData.FirstName || '',
        lastName: employeeData.LastName || '',
        fullName: `${employeeData.FirstName || ''} ${employeeData.LastName || ''}`.trim(),
        email: employeeData.EmailID || '',
        mobile: employeeData.Mobile || '',
        designation: employeeData.Designation || '',
        department: employeeData.Department || '',
        reportingTo: employeeData.Reporting_To || '',
        location: employeeData.Work_location || '',
        joiningDate: employeeData.Dateofjoining || '',
        status: employeeData.Employeestatus || 'Active',
        photo: employeeData.Photo_downloadUrl || '',
        band: employeeData.Band || '',
        probationDate: employeeData.Probation_date || ''
      };
      
      console.log(`Successfully processed employee data for ${employeeId}:`, processedEmployee);
      
      // Cache the employee data
      employeesCache.byId = employeesCache.byId || {};
      employeesCache.byId[employeeId] = processedEmployee;
      
      return processedEmployee;
    }
    
    console.warn(`Employee with ID ${employeeId} not found in API response`);
    throw new Error(`Employee with ID ${employeeId} not found`);
  } catch (error) {
    console.error(`Error fetching employee ${employeeId}:`, error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};
