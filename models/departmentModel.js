const pool = require("../config/db"); // PostgreSQL pool

const DepartmentModel = {
  // Create a new department
  createDepartment: async (name, image) => {
    const result = await pool.query(
      `INSERT INTO departments (name, image) VALUES ($1, $2) RETURNING *`,
      [name, image]
    );
    return result.rows[0];
  },

  // Get department by ID
  getDepartmentById: async (id) => {
    const result = await pool.query(`SELECT * FROM departments WHERE id = $1`, [
      id,
    ]);
    return result.rows[0];
  },

  // Get all departments
  getAllDepartments: async () => {
    const result = await pool.query(`SELECT * FROM departments`);
    return result.rows;
  },

  // Update department by ID
  updateDepartment: async (id, name, image) => {
    const result = await pool.query(
      `UPDATE departments SET name = $1, image = $2 WHERE id = $3 RETURNING *`,
      [name, image, id]
    );
    return result.rows[0];
  },
// Function to get advertisements by department ID
getAdsByDepartmentId: async (departmentId) => {
  const query = `
    SELECT * 
    FROM advertisements 
    WHERE department_id = $1
  `;
  const result = await pool.query(query, [departmentId]);
  return result.rows; // Return the array of advertisements
},
  // Delete department by ID
  deleteDepartment: async (id) => {
    const result = await pool.query(
      `DELETE FROM departments WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = DepartmentModel;
