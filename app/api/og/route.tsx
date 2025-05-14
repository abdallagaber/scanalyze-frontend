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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage:
              "linear-gradient(to bottom right, #f0f7ff, #e0f2fe, #c7e8ff)",
            padding: "40px 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "60%",
              paddingRight: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 54,
                fontWeight: "bold",
                color: "#1E3A8A",
                lineHeight: 1.2,
                marginBottom: "20px",
              }}
            >
              {title}
              <span style={{ color: "#2563EB" }}>Simplified</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#475569",
                marginBottom: "20px",
                maxWidth: "90%",
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "10px",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 18,
                  color: "#64748B",
                }}
              >
                ✓ HIPAA Compliant
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 18,
                  color: "#64748B",
                }}
              >
                ✓ Fast Results
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 18,
                  color: "#64748B",
                }}
              >
                ✓ Expert Care
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40%",
            }}
          >
            <img
              src={logoUrl}
              alt="Scanalyze Logo"
              width="350"
              height="250"
              style={{ objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#1E40AF", fontWeight: "bold" }}>
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
