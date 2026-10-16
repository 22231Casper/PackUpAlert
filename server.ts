import { serveFile } from "@std/http/file-server";
import * as path from "@std/path";

// list of files to serve
const filesToServe = [
    "index.html",
    "main.css",
    "main.js",
    "sounds/siren.mp3",
].map((x) => "/" + x); // map them to paths

// listen for http requests with Deno
Deno.serve((req) => {
    // get the url from the request
    const url = new URL(req.url);

    // get the pathname from the url
    const pathname = getPathName(url.pathname);

    // return a 404 if the file is not found
    if (!filesToServe.includes(pathname)) {
        return new Response(`${pathname} not found`, {
            status: 404,
        });
    }

    // serve the file
    return serveFile(req, path.join("./", pathname));
});

// map / to index.html so it works
function getPathName(pathname: string): string {
    if (pathname === "/") return "/index.html";
    return pathname;
}
