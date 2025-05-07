import axios from "axios";
import { getAuthHeader } from "./authService";
import { getApiUrl } from "../config/apiConfig";

// Store employees data in memory to avoid redundant API calls
let employeesCache = {};

// Fetch all employees (from all departments)
export const fetchAllEmployees = async () => {
  try {
    // For now, just fetch from the main department
    // In a real implementation, you might need to fetch from multiple departments
    // or use a different API endpoint that returns all employees
    const mainDepartmentId = "612996000034607912"; // Replace with your actual department ID

    const employees = await fetchEmployeesByDepartment(mainDepartmentId);
    return employees;
  } catch (error) {
    throw error;
  }
};

// Get token from local storage or another auth management system
// const getAuthToken = () => {
//   // Replace with your actual token management
//   return localStorage.getItem('auth_token');
// };

// Fetch employees by department or all employees if departmentId is null
export const fetchEmployeesByDepartment = async (departmentId) => {
  // If departmentId is null, fetch all employees from the main department
  if (departmentId === null) {
    // Check if we have a cached list of all employees
    if (employeesCache.allEmployees) {
      return employeesCache.allEmployees;
    }

    // For now, just fetch from the main department
    // In a real implementation, you might need to fetch from multiple departments
    const mainDepartmentId = "612996000034607912"; // Main department ID

    try {
      const employees = await fetchEmployeesByDepartment(mainDepartmentId);

      // Cache the result
      employeesCache.allEmployees = employees;
      return employees;
    } catch (error) {
      throw error;
    }
  }

  try {
    // Check if we have a cached list for this department
    if (
      employeesCache.byDepartment &&
      employeesCache.byDepartment[departmentId]
    ) {
      return employeesCache.byDepartment[departmentId];
    }

    const authHeader = await getAuthHeader();

    // Check if we're in development or production mode
    const isDevelopment = import.meta.env.DEV;

    // In development, use the standard API URL
    // In production, use the serverless function with path parameter
    const apiUrl = isDevelopment
      ? getApiUrl(
          `/forms/employee/getRelatedRecords?parentModule=department&id=${departmentId}&sIndex=1&limit=200`
        )
      : `${getApiUrl()}?path=forms/employee/getRelatedRecords&parentModule=department&id=${departmentId}&sIndex=1&limit=200`;

    const response = await axios.get(apiUrl, {
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    });

    // If we have a valid response, process and cache the data
    if (response.data) {
      const processedData = processEmployeeData(response.data);

      employeesCache.byDepartment = employeesCache.byDepartment || {};
      employeesCache.byDepartment[departmentId] = processedData;
      return processedData;
    }

    return [];
  } catch (error) {
    throw error;
  }
};

// Process the nested response data into a flattened format
export const processEmployeeData = (data) => {
  if (!data || !data.response || !data.response.result) return [];

  const processedData = [];

  data.response.result.forEach((item) => {
    // Each item in result is an object with a single key (employee ID)
    const employeeId = Object.keys(item)[0];
    const employeeData = item[employeeId][0]; // The actual employee data is in an array

    // Skip employees with terminated, inactive, resigned, or abscond status
    const status = employeeData.Employeestatus || "";
    if (
      status.toLowerCase() === "terminated" ||
      status.toLowerCase() === "inactive" ||
      status.toLowerCase() === "resigned" ||
      status.toLowerCase() === "abscond"
    ) {
      return; // Skip this employee
    }

    if (employeeData) {
      processedData.push({
        id: employeeId,
        zohoId: employeeData.Zoho_ID || "",
        employeeId: employeeData.EmployeeID || "",
        firstName: employeeData.FirstName || "",
        lastName: employeeData.LastName || "",
        fullName: `${employeeData.FirstName || ""} ${
          employeeData.LastName || ""
        }`.trim(),
        email: employeeData.EmailID || "",
        mobile: employeeData.Mobile || "",
        designation: employeeData.Designation || "",
        department: employeeData.Department || "",
        reportingTo: employeeData.Reporting_To || "",
        location: employeeData.Work_location || "",
        joiningDate: employeeData.Dateofjoining || "",
        status: employeeData.Employeestatus || "Active",
        photo: employeeData.Photo_downloadUrl || "",
        band: employeeData.Band || "",
        probationDate: employeeData.Probation_date || "",
        // Add more fields as needed
      });
    }
  });

  return processedData;
};

// Get employee details by ID
export const fetchEmployeeById = async (employeeId) => {
  try {
    // Check if employee is in cache
    if (employeesCache.byId && employeesCache.byId[employeeId]) {
      return employeesCache.byId[employeeId];
    }

    // If not in cache, fetch from API
    const authHeader = await getAuthHeader();

    const response = await axios.get(
      `${API_BASE_URL}/forms/employee/getRecordByID?id=${employeeId}`,
      {
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    // Process the employee data
    if (
      response.data &&
      response.data.response &&
      response.data.response.result
    ) {
      const employeeData = response.data.response.result;

      const processedEmployee = {
        id: employeeId,
        zohoId: employeeData.Zoho_ID || "",
        employeeId: employeeData.EmployeeID || "",
        firstName: employeeData.FirstName || "",
        lastName: employeeData.LastName || "",
        fullName: `${employeeData.FirstName || ""} ${
          employeeData.LastName || ""
        }`.trim(),
        email: employeeData.EmailID || "",
        mobile: employeeData.Mobile || "",
        designation: employeeData.Designation || "",
        department: employeeData.Department || "",
        reportingTo: employeeData.Reporting_To || "",
        location: employeeData.Work_location || "",
        joiningDate: employeeData.Dateofjoining || "",
        status: employeeData.Employeestatus || "Active",
        photo: employeeData.Photo_downloadUrl || "",
        band: employeeData.Band || "",
        probationDate: employeeData.Probation_date || "",
      };

      // Cache the employee data
      employeesCache.byId = employeesCache.byId || {};
      employeesCache.byId[employeeId] = processedEmployee;

      return processedEmployee;
    }

    throw new Error(`Employee with ID ${employeeId} not found`);
  } catch (error) {
    throw error;
  }
};
