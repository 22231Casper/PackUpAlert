import { serveFile } from "@std/http/file-server";
import * as path from "@std/path";

const devModeEnabled = Deno.args[0] === "dev";

const filesToServe = [
    "index.html",
    "main.css",
    "main.js",
].map((x) => "/" + x);

console.log(`starting ${devModeEnabled ? "dev" : "prod"} server...`);

const server = Deno.serve((req) => {
    //console.log("got request:", req);
    const url = new URL(req.url);
    //console.log("url:", url);

    const pathname = getPathName(url.pathname);

    if (!filesToServe.includes(pathname)) {
        return new Response(`${pathname} not found`, {
            status: 404,
        });
    }

    // Do someting to serve the file here

    return serveFile(req, path.join("./", pathname));
});

function getPathName(pathname: string): string {
    if (pathname === "/") return "/index.html";
    return pathname;
}

console.log("started server");
await server.finished;
console.log("server finished");
