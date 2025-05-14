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

    // Generate a simple SVG logo rather than relying on an external image
    const logoSvg = `
      <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="35" fill="#2563EB" opacity="0.9" />
        <circle cx="40" cy="40" r="28" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" />
        <path d="M30 30 L50 50 M30 50 L50 30" stroke="#2563EB" stroke-width="3" />
        <text x="85" y="35" font-size="24" font-weight="bold" fill="#2563EB">SCANALYZE</text>
        <text x="85" y="55" font-size="14" fill="#475569">Medical Diagnostics</text>
      </svg>
    `;

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
              {title.includes("Simplified") ? title : `${title} Simplified`}
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
            dangerouslySetInnerHTML={{ __html: logoSvg }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#1E40AF", fontWeight: "bold" }}>
              scanalyze-test.vercel.app
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
