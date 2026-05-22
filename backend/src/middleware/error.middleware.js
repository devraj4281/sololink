import { ENV } from "../lib/env.js";

const handleCastErrorDB = (err) => {
  return {
    message: `Invalid ${err.path}: ${err.value}.`,
    statusCode: 400,
  };
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return {
    message: `Duplicate field value: ${value}. Please use another value!`,
    statusCode: 400,
  };
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return {
    message: `Invalid input data. ${errors.join(". ")}`,
    statusCode: 400,
  };
};

const handleJWTError = () => ({
  message: "Invalid token. Please log in again!",
  statusCode: 401,
});

const handleJWTExpiredError = () => ({
  message: "Your token has expired! Please log in again.",
  statusCode: 401,
  code: "TOKEN_EXPIRED",
});

export const errorHandler = (err, req, res, next) => {
  console.error("💥 Error encountered in API request:", err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  error.message = err.message;

  // Handle common database / token errors
  if (err.name === "CastError") error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  if (err.name === "ValidationError") error = handleValidationErrorDB(error);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const isDev = ENV.NODE_ENV === "development";

  res.status(error.statusCode || err.statusCode).json({
    status: error.status || err.status,
    message: error.message || err.message || "Internal server error",
    code: error.code || err.code || undefined,
    stack: isDev ? err.stack : undefined,
  });
};
