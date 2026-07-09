import { type ZodSchema, ZodError } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: { field: string; message: string }[];
}

export function validate<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return { success: false, errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })) };
    }
    return { success: false, errors: [{ field: "unknown", message: "验证失败" }] };
  }
}
