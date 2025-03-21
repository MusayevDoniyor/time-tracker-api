const response = (res, status, error = null, data = null) => {
  const statusMessages = {
    200: "Successfull",
    201: "Successfully created",
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    422: "Unprocessable Entity",
    500: "Server error",
  };

  const responseObject = {
    status,
    message: statusMessages[status] || "Unknown Status",
    ...(error && { error: error.toString() }),
    ...(data && { data }),
  };

  res.status(status).json(responseObject);
};

module.exports = response;
