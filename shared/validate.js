export function required(form, fields) {
  const errors = [];
  for (const field of fields) {
    if (!form.has(field) || !form.get(field)) {
      errors.push([field, "This field is required"]);
    }
  }

  return errors;
}
