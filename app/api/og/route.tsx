import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic params
    const title =
      searchParams.get("title") || "Advanced Medical Diagnostics Simplified";
    const subtitle =
      searchParams.get("subtitle") ||
      "Cutting-edge laboratory testing and medical imaging with fast, accurate results.";

    // Get host from request for logo
    const { host } = new URL(request.url);
    const protocol = host.includes("localhost") ? "http" : "https";
    const logoUrl = `${protocol}://${host}/images/scanalyze-logo.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage:
              "linear-gradient(to bottom right, #EFF6FF, white, #DBEAFE)",
            padding: "40px 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: "bold",
              color: "#1E40AF",
              textAlign: "center",
              marginBottom: "20px",
              lineHeight: 1.2,
              maxWidth: "85%",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#475569",
              textAlign: "center",
              marginBottom: "40px",
              maxWidth: "70%",
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <img src={logoUrl} alt="Scanalyze Logo" width="400" height="133" />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 24, color: "#1E40AF", fontWeight: "bold" }}>
              {host}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Error generating OpenGraph image: ${e.message}`);
    return new Response(`Error generating OpenGraph image`, {
      status: 500,
    });
  }
}
