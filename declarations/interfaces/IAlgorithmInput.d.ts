/**
 * Describes a single positional input slot of an algorithm.
 *
 * This separates the two concerns that the old flat `inputTypes: string[]`
 * conflated:
 *  - **arity**  — the number of input slots is the length of the `inputs` array
 *    (a final slot may be `variadic` to accept an unbounded number of values);
 *  - **type**   — the `types` of each individual slot (a union of accepted types).
 */
export interface IAlgorithmInput {
    /** Identifier for this input slot (e.g. "node", "value", "numbers"). */
    name: string;
    /**
     * Accepted types for this slot, as a union — the wired input may be any one
     * of these (e.g. ["SpinalNode", "SpinalNode[]"]). Use ["any"] for unconstrained.
     */
    types: string[];
    /** Human-readable explanation of what this input is. */
    description: string;
    /** Whether this input must be provided. Defaults to true when omitted. */
    required?: boolean;
    /**
     * When true, this slot accepts one or more values of `types`, collected into
     * an array and passed to the algorithm (e.g. SUM_NUMBERS over many numbers).
     * Only the final slot may be variadic.
     */
    variadic?: boolean;
}
