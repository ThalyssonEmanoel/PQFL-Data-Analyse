import "dotenv/config";
import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const port = process.env.PORT || 8080;

const start = async () => {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`API rodando em: http://localhost:${port}`);
      console.log(`Swagger UI:     http://localhost:${port}/docs`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error.message);
    process.exit(1);
  }
};

start();
