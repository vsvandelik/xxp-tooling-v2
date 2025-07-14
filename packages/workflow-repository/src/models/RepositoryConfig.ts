/**
 * Repository configuration and search options models.
 * Defines structures for configuring workflow repositories and
 * specifying search criteria for workflow discovery.
 */

/**
 * Configuration for a workflow repository.
 * Defines connection parameters for both local and remote repositories.
 */
export interface RepositoryConfig {
  /** Type of repository - local filesystem or remote API */
  readonly type: 'local' | 'remote';
  /** Human-readable name for the repository */
  readonly name: string;
  /** Base path for local repositories or endpoint path for remote */
  readonly path: string;
  /** Base URL for remote repositories */
  readonly url?: string;
  /** Authentication token for remote repositories (format: username:password) */
  readonly authToken?: string;
  /** Whether this repository should be used as the default */
  readonly isDefault?: boolean;
}

/**
 * Options for searching workflows within repositories.
 * Supports text search, filtering, and pagination.
 */
export interface WorkflowSearchOptions {
  /** Text query to search in workflow names and descriptions */
  readonly query?: string;
  /** Array of tags to filter by */
  readonly tags?: readonly string[];
  /** Author name to filter by */
  readonly author?: string;
  /** Path prefix to filter by */
  readonly path?: string;
  /** Maximum number of results to return */
  readonly limit?: number;
  /** Number of results to skip (for pagination) */
  readonly offset?: number;
}
