# Vite Scaffolder Service

A TypeScript web server that generates Vite React TypeScript projects based on configuration input and returns them as downloadable zip files.

## Features

- ✅ **npm verification** - Ensures npm is installed on startup
- 🏗️ **Project generation** - Creates Vite React TypeScript projects using the official template
- 📦 **Zip packaging** - Packages generated projects into downloadable zip files
- 🔧 **Configuration support** - Accepts JSON configuration (extensible for future customization)
- 🏥 **Health monitoring** - Includes health check endpoint
- 🧹 **Automatic cleanup** - Cleans up temporary files after processing

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## Installation

1. Create the project structure:
```bash
mkdir vite-scaffolder-service
cd vite-scaffolder-service
mkdir src
```

2. Copy the files:
   - Save the main server code as `src/server.ts`
   - Save the package.json file as `package.json`
   - Save the TypeScript config as `tsconfig.json`

3. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
```bash
# Run in development mode with auto-reload
npm run dev

# Or with nodemon for file watching
npm run dev:watch
```

### Production Mode
```bash
# Build the project
npm run build

# Start the server
npm start
```

The server will start on port 3000 by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T12:00:00.000Z",
  "service": "vite-scaffolder"
}
```

### Generate Project
```
POST /generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "projectName": "my-app",
  "customOptions": {
    "someConfig": "value"
  }
}
```

**Response:**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="my-react-ts-app.zip"`
- Binary zip file containing the generated Vite React TypeScript project

## Example Usage

### Using curl
```bash
# Health check
curl http://localhost:3000/health

# Generate project
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"projectName": "my-app"}' \
  --output my-react-ts-app.zip
```

### Using JavaScript/fetch
```javascript
// Generate and download project
const response = await fetch('http://localhost:3000/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectName: 'my-custom-app',
    customOptions: {
      theme: 'dark'
    }
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-react-ts-app.zip';
  a.click();
}
```

## Project Structure

```
vite-scaffolder-service/
├── src/
│   └── server.ts          # Main server implementation
├── dist/                  # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## How It Works

1. **Startup Check**: Verifies npm is installed and accessible
2. **Request Processing**: Accepts JSON configuration via POST /generate
3. **Project Creation**: Runs `npm create vite@latest my-react-ts-app -- --template react-ts`
4. **Packaging**: Creates a zip archive of the generated project
5. **Response**: Streams the zip file back to the client
6. **Cleanup**: Removes temporary files and directories

## Generated Project Structure

The service generates a standard Vite React TypeScript project with:

```
my-react-ts-app/
├── public/
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Error Handling

The service includes comprehensive error handling:
- npm availability check on startup
- Process execution error handling
- File system operation error handling
- Automatic cleanup on errors
- Detailed error responses with request IDs

## Environment Variables

- `PORT`: Server port (default: 3000)

## Logging

The service provides detailed console logging for:
- Startup checks
- Request processing
- Project generation steps
- Error conditions
- Cleanup operations

## Future Enhancements

The configuration system is designed to be extensible. Future versions could support:
- Custom project names
- Different Vite templates
- Custom file modifications
- Environment-specific configurations
- Plugin installations

## Troubleshooting

### "npm is not installed" error
- Ensure Node.js and npm are properly installed
- Check that npm is in your system PATH
- Try running `npm --version` manually

### Project generation fails
- Check disk space in temp directory
- Verify network connectivity for package downloads
- Check npm registry accessibility

### Zip file issues
- Ensure sufficient disk space
- Check file permissions in temp directory
