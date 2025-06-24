# Guidelines for Codex contributors

## Setup
- Run `npm install` if dependencies have not been installed.
- Verify the project builds with `npm run build`. There are no automated tests, so a successful build is enough to validate changes.

## Development
- Source code is written in TypeScript using React and Astro.
- Components are located under `src/components/` and 3D model files under `src/models/`.
- Imports can use the aliases `@/` for `src/` and `@lib/` for `lib/` as configured in `tsconfig.json`.

## Style
- Use 2 spaces for indentation and terminate statements with semicolons.
- Follow the repository `.editorconfig`: use LF line endings, trim trailing whitespace and ensure files end with a newline.

## Checks
- Before committing, run `npm run build` to make sure the project compiles without errors.
