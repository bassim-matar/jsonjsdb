# GitHub Copilot Instructions - jsonjsdb Monorepo

## Project Structure

This is a monorepo containing two main packages:

### 1. `jsonjsdb/` - Core Library

- TypeScript library for JSONJS database loading
- Modular architecture: Jsonjsdb (interface), Loader, DBrowser, IntegrityChecker
- Browser and Node.js support via Vite
- Testing with Vitest on the browser

### 2. `jsonjsdb-builder/` - Builder Tools

- Tools and utilities for building/processing JSONJS databases
- Comparison change detection and logging
- Excel import functionality
- Testing with Vitest

## Development Context

- **Monorepo with Workspaces**: Uses npm workspaces for dependency management and unified commands
- **CI/CD Pipeline**: Separate GitHub Actions workflows for each package (ci-core.yml, ci-builder.yml)
- **Path-based Triggers**: CI workflows triggered only when relevant package files change
- **Unified Commands**: Root package.json provides commands for building/testing both packages
- **Shared Tooling**: Common ESLint config and development standards across workspaces

## Code Comments Policy

- Add comments ONLY when absolutely necessary
- All comments must be written in English ONLY
- Never use any other language in comments
- Focus on explaining "why", not "what"
- Document only non-obvious business logic or complex algorithms

## Code Quality Standards

- **Clean & Professional**: Write clean, maintainable code that follows industry best practices
- **Standard Compliance**: Adhere to TypeScript and JavaScript standards consistently
- **Concise & Clear**: Keep code concise while maintaining readability and clarity
- **No Duplication**: Avoid code duplication - extract common logic into reusable functions
- **Simple & Readable**: Prioritize simplicity and readability over complex abstractions
- **Type Safety**: Use proper TypeScript types - avoid `any` type
- **Consistent Naming**: Use clear, descriptive names for variables, functions, and classes
- **Single Responsibility**: Each function and class should have a single, well-defined purpose
