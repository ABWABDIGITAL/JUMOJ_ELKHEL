const formatSuccessResponse = (data, message) => {
  // Function to transform data by removing unwanted fields
  const transformData = (inputData) => {
    if (Array.isArray(inputData)) {
      return inputData.map((item) => {
        // Explicitly remove unwanted fields from each object in array
        const { __v, updatedAt, ...rest } = item;

        return { ...rest };
      });
    } else if (inputData && typeof inputData === 'object') {
      // For single object data
      const { __v, updatedAt, ...rest } = inputData;

      // Return the object without unwanted fields
      return { ...rest };
    } else {
      // Return the data as is if it's not an object or array
      return inputData;
    }
  };

  const transformedData = transformData(data);

  return {
    success: true,
    message: message || 'Operation completed successfully',
    data: transformedData,
  };
};

const formatErrorResponse = (message, data = null) => {
  return {
    success: false,
    message: message || 'An error occurred',
    data,
  };
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
};
