import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.1.22/mod.ts";

function addCorsIfNeeded(response: Response) {
  const headers = new Headers(response.headers);

  if (!headers.has("access-control-allow-origin")) {
    headers.set("access-control-allow-origin", "*");
  }

  return headers;
}

function isUrl(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function handleRequest(request: Request) {
  const { pathname, search } = new URL(request.url);
  const url = pathname.substring(1) + search;

  if (isUrl(url)) {
    console.log("proxy to %s", url);
    const corsHeaders = addCorsIfNeeded(new Response());
    if (request.method.toUpperCase() === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const response = await fetch(url, request);
    const headers = addCorsIfNeeded(response);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const readme = await Deno.readTextFile("./README.md");
  const body = render(readme);
  const html = `{"code":"500","msg":"An unknown error occurred on the server","Service":"Proxy-Download"}`;
  return new Response(html, {
    headers: {
      "content-type": "application/json;charset=utf-8",
    },
  });
}

const port = Deno.env.get("PORT") ?? "8000";

serve(handleRequest, { port: Number(port) });
