// PerformanceRatingCalculator excluded from tsconfig due to circular dependency with AI package.
// MoveComparator excluded from build for same reason.
// Both are available via direct path import when needed (e.g., API's pr.ts).
export * from './PositionReconstructor'