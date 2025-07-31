Create a program based on the issue description:

Task description: We need a service to accept the configuration file from WizardUI, generate code. Decided to use https://vite.dev/ default TS template as a template for Scaffolder.

TypeScript web server:
- on startup:
    - ensure 'npm' is installed
- endpoint to generate code /generate
    - accepts json configuration
    - runs 'npm create vite@latest my-react-ts-app -- --template react-ts'
    - make a zip archive from generated folder
    - respond with zip file in API request
- /health endpoint

For context – here is the expected output from npm:
```
$ npm create vite@latest my-react-ts-app -- --template react-ts
Need to install the following packages:
create-vite@7.0.3
Ok to proceed? (y) y


> npx
> create-vite my-react-ts-app --template react-ts

│
◇  Scaffolding project in ./scaffolder/my-react-ts-app...
│
└  Done. Now run:

  cd my-react-ts-app
  npm install
  npm run dev

```
