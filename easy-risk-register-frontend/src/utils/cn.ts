/**
 * Utility function to conditionally join CSS class names
 * Filters out falsy values (null, undefined, false) and joins the remaining classes
 * @param classes - Array of class names that may include falsy values
 * @returns A string of space-separated CSS class names
 */
export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

export default cn
