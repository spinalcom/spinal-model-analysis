export interface IAlgorithmParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  /**
   * The allowed values, when the parameter is a choice among a few. A builder renders them as a
   * list, and saving an analytic with another value is refused (validateConfig).
   */
  options?: readonly (string | number)[];
  /**
   * The value the block uses when the parameter is left empty. Documentation for the builder
   * (shown as the field's hint) — run() is what applies it, so keep the two in sync.
   */
  default?: string | number | boolean;
  /** Long text (a mail body, a JSON document, a curl command): a builder gives it a multi-line field. */
  multiline?: boolean;
}
