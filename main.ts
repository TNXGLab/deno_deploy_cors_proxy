import {serve} from "https://deno.land/std@0.152.0/http/server.ts";
// 导入Deno标准库中的HTTP服务器模块

import {CSS, render} from "https://deno.land/x/gfm@0.1.22/mod.ts";
// 导入用于渲染Markdown文件的模块

// 辅助函数：根据需要添加CORS头部信息
function addCorsIfNeeded(response: Response) {
    const headers = new Headers(response.headers);

    if (!headers.has("access-control-allow-origin")) {
        headers.set("access-control-allow-origin", "*");
    }

    return headers;
}

// 辅助函数：检查字符串是否是有效的URL
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

// 处理每个传入的HTTP请求的函数
async function handleRequest(request: Request) {
    // 解构请求URL的路径和查询字符串
    const {pathname, search} = new URL(request.url);
    const url = pathname.substring(1) + search;

    if (isUrl(url)) {
        // 如果是有效的URL，进行代理请求的处理
        console.log("proxy to %s", url);
        // 添加CORS头部信息
        const corsHeaders = addCorsIfNeeded(new Response());
        if (request.method.toUpperCase() === "OPTIONS") {
            // 如果请求方法是OPTIONS（预检请求），返回只带有CORS头部的响应
            return new Response(null, {headers: corsHeaders});
        }
        // 发起代理请求
        const response = await fetch(url, request);
        // 添加CORS头部信息到响应
        const headers = addCorsIfNeeded(response);
        // 构建新的响应对象，包括原始响应的状态、状态文本和头部信息
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    // 如果不是有效的URL，返回README.md文件的渲染结果
    const readme = await Deno.readTextFile("./README.md");
    // 渲染README.md文件为HTML内容
    const body = render(readme);
    // 构建包含错误信息的JSON格式响应
    const html = `{"code":"500","msg":"An unknown error occurred on the server","Service":"Proxy-Download"}`;
    return new Response(html, {
        headers: {
            "content-type": "application/json;charset=utf-8",
        },
    });
}

// 获取环境变量中的端口号，如果不存在则使用默认端口号8000
const port = Deno.env.get("PORT") ?? "8000";

// 启动HTTP服务器并监听指定端口
serve(handleRequest, {port: Number(port)});
