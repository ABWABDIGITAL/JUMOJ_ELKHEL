const DepartmentModel = require("../models/departmentModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

// Create a new department with image upload
const createDepartment = async (req, res) => {
  const { name } = req.body;
  const image = req.file ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/departments/${req.file.filename}` : null;

  try {
    const newDepartment = await DepartmentModel.createDepartment(name, image);
    res.status(201).json(formatSuccessResponse(newDepartment, "Department created successfully"));
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json(formatErrorResponse("Failed to create department"));
  }
};

// Get a department by ID
const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const department = await DepartmentModel.getDepartmentById(id);
    if (department) {
      res.status(200).json(formatSuccessResponse(department, "Department fetched successfully"));
    } else {
      res.status(404).json(formatErrorResponse("Department not found"));
    }
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch department"));
  }
};

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await DepartmentModel.getAllDepartments();
    res.status(200).json(formatSuccessResponse(departments, "Departments fetched successfully"));
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch departments"));
  }
};

// Update department by ID
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.file ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/departments/${req.file.filename}` : null;

  try {
    const updatedDepartment = await DepartmentModel.updateDepartment(id, name, image);
    if (updatedDepartment) {
      res.status(200).json(formatSuccessResponse(updatedDepartment, "Department updated successfully"));
    } else {
      res.status(404).json(formatErrorResponse("Department not found"));
    }
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json(formatErrorResponse("Failed to update department"));
  }
};

// Delete department by ID
const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedDepartment = await DepartmentModel.deleteDepartment(id);
    if (deletedDepartment) {
      res.status(200).json(formatSuccessResponse(null, "Department deleted successfully"));
    } else {
      res.status(404).json(formatErrorResponse("Department not found"));
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json(formatErrorResponse("Failed to delete department"));
  }
};
// Get advertisements by department ID
const getAdsByDepartmentId = async (req, res) => {
  const { id } = req.params; // Get department ID from the request parameters
  try {
    const ads = await DepartmentModel.getAdsByDepartmentId(id); // Fetch advertisements
    if (ads.length > 0) {
      res.status(200).json(formatSuccessResponse(ads, "Advertisements fetched successfully"));
    } else {
      res.status(404).json(formatErrorResponse("No advertisements found for this department"));
    }
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch advertisements"));}
  };
module.exports = {
  createDepartment,
  getDepartmentById,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getAdsByDepartmentId
};
