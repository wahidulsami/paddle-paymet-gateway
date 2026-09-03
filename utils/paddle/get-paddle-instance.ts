import { Environment, LogLevel, Paddle, type PaddleOptions } from "@paddle/paddle-node-sdk";

let paddleInstance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (paddleInstance) {
    return paddleInstance;
  }

  const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
  if (!env) {
    throw new Error(
      "NEXT_PUBLIC_PADDLE_ENV is not set. You must explicitly configure 'sandbox' or 'production' in your environment."
    );
  }

  if (env !== "sandbox" && env !== "production") {
    throw new Error(
      `Invalid NEXT_PUBLIC_PADDLE_ENV: "${env}". Must be "sandbox" or "production".`
    );
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "PADDLE_API_KEY is not set. Please provide your Paddle API key in your environment variables (e.g. in .env.local)."
    );
  }

  const environment = env === "production" ? Environment.production : Environment.sandbox;

  const options: PaddleOptions = {
    environment,
    logLevel: LogLevel.error,
  };

  paddleInstance = new Paddle(apiKey, options);
  return paddleInstance;
}
