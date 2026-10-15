import { handleMcpHttp } from "@/lib/mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleMcpHttp(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleMcpHttp(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleMcpHttp(request);
}
