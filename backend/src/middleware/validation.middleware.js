import AppError from "../lib/AppError.js";

export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // Treat missing body as empty object so Zod receives a known shape
      const result = schema.safeParse(req.body ?? {});
      if (!result.success) {
        const errors = result.error?.errors;
        const messages = Array.isArray(errors)
          ? errors.map((err) => err.message).join(". ")
          : "Invalid request body";
        return next(new AppError(messages, 400));
      }
      req.body = result.data;
      next();
    } catch (err) {
      next(new AppError("Validation error: " + (err.message || "Unknown"), 400));
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query ?? {});
      if (!result.success) {
        const errors = result.error?.errors;
        const messages = Array.isArray(errors)
          ? errors.map((err) => err.message).join(". ")
          : "Invalid query parameters";
        return next(new AppError(messages, 400));
      }
      req.query = result.data;
      next();
    } catch (err) {
      next(new AppError("Validation error: " + (err.message || "Unknown"), 400));
    }
  };
};
