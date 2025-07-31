import express from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { promisify } from "util";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Utility function to check if npm is installed
async function checkNpmInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const npmCheck = spawn("npm", ["--version"]);

    npmCheck.on("close", (code) => {
      resolve(code === 0);
    });

    npmCheck.on("error", () => {
      resolve(false);
    });
  });
}

// Utility function to run npm create vite command
async function createViteProject(
  projectName: string,
  workingDir: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Creating Vite project: ${projectName} in ${workingDir}`);

    const viteCreate = spawn(
      "npm",
      ["create", "vite@latest", projectName, "--", "--template", "react-ts"],
      {
        cwd: workingDir,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    // Auto-respond 'y' to the installation prompt
    viteCreate.stdin.write("y\n");
    viteCreate.stdin.end();

    let stdout = "";
    let stderr = "";

    viteCreate.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log("STDOUT:", data.toString());
    });

    viteCreate.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("STDERR:", data.toString());
    });

    viteCreate.on("close", (code) => {
      console.log(`Vite creation process exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Failed to create Vite project. Exit code: ${code}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`,
          ),
        );
      }
    });

    viteCreate.on("error", (error) => {
      console.error("Error spawning npm create vite:", error);
      reject(error);
    });
  });
}

// Utility function to create zip archive
async function createZipArchive(
  sourceDir: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on("close", () => {
      console.log(`Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Utility function to clean up temporary directories
async function cleanupDirectory(dirPath: string): Promise<void> {
  try {
    if (fs.existsSync(dirPath)) {
      await promisify(fs.rm)(dirPath, { recursive: true, force: true });
      console.log(`Cleaned up directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up directory ${dirPath}:`, error);
  }
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "vite-scaffolder",
  });
});

// Generate code endpoint
app.post("/generate", async (req, res) => {
  const requestId = uuidv4();
  const tempDir = path.join(tmpdir(), `vite-scaffolder-${requestId}`);
  const projectName = "my-react-ts-app";
  const projectPath = path.join(tempDir, projectName);
  const zipPath = path.join(tempDir, `${projectName}.zip`);

  try {
    console.log(`[${requestId}] Starting code generation process`);
    console.log(
      `[${requestId}] Configuration received:`,
      JSON.stringify(req.body, null, 2),
    );

    // Create temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create Vite project
    await createViteProject(projectName, tempDir);

    // Verify project was created
    if (!fs.existsSync(projectPath)) {
      throw new Error("Vite project was not created successfully");
    }

    // Create zip archive
    await createZipArchive(projectPath, zipPath);

    // Verify zip was created
    if (!fs.existsSync(zipPath)) {
      throw new Error("Failed to create zip archive");
    }

    // Send zip file as response
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${projectName}.zip"`,
    );

    const zipStream = fs.createReadStream(zipPath);
    zipStream.pipe(res);

    zipStream.on("end", async () => {
      console.log(`[${requestId}] Zip file sent successfully`);
      // Clean up temporary files after sending
      await cleanupDirectory(tempDir);
    });

    zipStream.on("error", async (error) => {
      console.error(`[${requestId}] Error streaming zip file:`, error);
      await cleanupDirectory(tempDir);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to send zip file" });
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Error generating code:`, error);

    // Clean up on error
    await cleanupDirectory(tempDir);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate code",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      });
    }
  }
});

// Error handling middleware
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

// Startup function
async function startServer() {
  try {
    // Check if npm is installed
    const npmInstalled = await checkNpmInstalled();
    if (!npmInstalled) {
      console.error("ERROR: npm is not installed or not accessible");
      process.exit(1);
    }

    console.log("✅ npm is installed and accessible");

    app.listen(PORT, () => {
      console.log(`🚀 Vite Scaffolder Service is running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(
        `🔧 Generate endpoint: POST http://localhost:${PORT}/generate`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
